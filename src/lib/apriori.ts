/**
 * Apriori Association Rule Mining Engine
 * Implements frequent itemset generation and association rule extraction
 * (Support, Confidence, Lift) over street-food transactions and customer meal baskets.
 */

export interface Transaction {
  id: string;
  items: string[]; // e.g. ['Pani Puri', 'Masala Puri']
}

export interface AssociationRule {
  antecedent: string[]; // LHS (If customer buys...)
  consequent: string[]; // RHS (Then customer also buys...)
  support: number; // P(A ∩ B)
  confidence: number; // P(B | A) = support(A ∪ B) / support(A)
  lift: number; // confidence / support(B)
  explanation: string;
}

export interface AprioriMiningResult {
  frequentItemsets: Array<{
    itemset: string[];
    support: number;
    count: number;
  }>;
  rules: AssociationRule[];
  totalTransactions: number;
  parameters: {
    minSupport: number;
    minConfidence: number;
  };
}

/**
 * Run Apriori Algorithm on transaction meal baskets
 * 
 * @param transactions Array of transactions where each has an array of dish names
 * @param minSupport Minimum support threshold (default 0.15 = 15%)
 * @param minConfidence Minimum confidence threshold (default 0.40 = 40%)
 */
export function runAprioriMining(
  transactions: Transaction[],
  minSupport: number = 0.15,
  minConfidence: number = 0.40
): AprioriMiningResult {
  const N = transactions.length;
  if (N === 0) {
    return {
      frequentItemsets: [],
      rules: [],
      totalTransactions: 0,
      parameters: { minSupport, minConfidence },
    };
  }

  // 1. Generate 1-itemset frequencies
  const singleItemCounts = new Map<string, number>();
  transactions.forEach((tx) => {
    // Unique items per transaction
    const uniqueItems = Array.from(new Set(tx.items));
    uniqueItems.forEach((item) => {
      singleItemCounts.set(item, (singleItemCounts.get(item) || 0) + 1);
    });
  });

  const frequent1Itemsets: Array<{ itemset: string[]; support: number; count: number }> = [];
  singleItemCounts.forEach((count, item) => {
    const support = count / N;
    if (support >= minSupport) {
      frequent1Itemsets.push({ itemset: [item], support: Number(support.toFixed(3)), count });
    }
  });

  // 2. Generate 2-itemset candidates and frequencies
  const pairCounts = new Map<string, { count: number; items: [string, string] }>();
  transactions.forEach((tx) => {
    const unique = Array.from(new Set(tx.items)).sort();
    for (let i = 0; i < unique.length; i++) {
      for (let j = i + 1; j < unique.length; j++) {
        const key = `${unique[i]}__AND__${unique[j]}`;
        const existing = pairCounts.get(key) || { count: 0, items: [unique[i], unique[j]] };
        existing.count++;
        pairCounts.set(key, existing);
      }
    }
  });

  const frequent2Itemsets: Array<{ itemset: string[]; support: number; count: number }> = [];
  pairCounts.forEach(({ count, items }) => {
    const support = count / N;
    if (support >= minSupport) {
      frequent2Itemsets.push({ itemset: items, support: Number(support.toFixed(3)), count });
    }
  });

  // 3. Extract Association Rules from Frequent 2-Itemsets
  const rules: AssociationRule[] = [];

  frequent2Itemsets.forEach(({ itemset, support: pairSupport }) => {
    const [itemA, itemB] = itemset;
    const countA = singleItemCounts.get(itemA) || 0;
    const countB = singleItemCounts.get(itemB) || 0;

    const supportA = countA / N;
    const supportB = countB / N;

    // Rule 1: A -> B
    if (supportA > 0) {
      const confidenceAB = pairSupport / supportA;
      const liftAB = supportB > 0 ? confidenceAB / supportB : 1;

      if (confidenceAB >= minConfidence) {
        rules.push({
          antecedent: [itemA],
          consequent: [itemB],
          support: Number(pairSupport.toFixed(3)),
          confidence: Number(confidenceAB.toFixed(3)),
          lift: Number(liftAB.toFixed(2)),
          explanation: `Customers ordering ${itemA} are ${(confidenceAB * 100).toFixed(0)}% likely to also order ${itemB} (Lift: ${liftAB.toFixed(2)}x baseline).`,
        });
      }
    }

    // Rule 2: B -> A
    if (supportB > 0) {
      const confidenceBA = pairSupport / supportB;
      const liftBA = supportA > 0 ? confidenceBA / supportA : 1;

      if (confidenceBA >= minConfidence) {
        rules.push({
          antecedent: [itemB],
          consequent: [itemA],
          support: Number(pairSupport.toFixed(3)),
          confidence: Number(confidenceBA.toFixed(3)),
          lift: Number(liftBA.toFixed(2)),
          explanation: `Customers ordering ${itemB} are ${(confidenceBA * 100).toFixed(0)}% likely to also order ${itemA} (Lift: ${liftBA.toFixed(2)}x baseline).`,
        });
      }
    }
  });

  // Sort rules descending by Lift
  rules.sort((a, b) => b.lift - a.lift);

  return {
    frequentItemsets: [...frequent1Itemsets, ...frequent2Itemsets].sort((a, b) => b.support - a.support),
    rules,
    totalTransactions: N,
    parameters: {
      minSupport,
      minConfidence,
    },
  };
}
