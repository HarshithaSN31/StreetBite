import { haversineDistance } from './geo';

export interface DBSCANPoint {
  id: string;
  name: string;
  locality: string;
  latitude: number;
  longitude: number;
  clusterId?: number; // -1 for noise, >= 0 for clusters
  pointType?: 'CORE' | 'BORDER' | 'NOISE';
}

export interface DBSCANClusterResult {
  clusters: Array<{
    clusterId: number;
    clusterName: string;
    centerLat: number;
    centerLng: number;
    stallsCount: number;
    stalls: DBSCANPoint[];
    dominantLocality: string;
  }>;
  noisePoints: DBSCANPoint[];
  totalPoints: number;
  parameters: {
    epsMeters: number;
    minPts: number;
  };
}

/**
 * Density-Based Spatial Clustering of Applications with Noise (DBSCAN)
 * Groups street food stalls into dense spatial clusters (food streets/hubs)
 * based on Haversine distance without requiring a pre-specified cluster count 'k'.
 * 
 * @param points Array of geographic vendor points
 * @param epsMeters Maximum radius epsilon in meters (default 400m)
 * @param minPts Minimum stalls to form a dense core cluster (default 3)
 */
export function runDBSCANClustering(
  points: DBSCANPoint[],
  epsMeters: number = 400,
  minPts: number = 3
): DBSCANClusterResult {
  const visited = new Set<string>();
  const pointMap = new Map<string, DBSCANPoint>();

  // Deep clone to preserve immutability
  const dataset: DBSCANPoint[] = points.map((p) => {
    const clone = { ...p, clusterId: undefined, pointType: undefined };
    pointMap.set(clone.id, clone);
    return clone;
  });

  // Find all epsilon neighbors using Haversine distance
  function getNeighbors(p: DBSCANPoint): DBSCANPoint[] {
    return dataset.filter((neighbor) => {
      const dist = haversineDistance(p.latitude, p.longitude, neighbor.latitude, neighbor.longitude);
      return dist <= epsMeters;
    });
  }

  let currentClusterId = 0;

  for (const point of dataset) {
    if (visited.has(point.id)) continue;
    visited.add(point.id);

    const neighbors = getNeighbors(point);

    if (neighbors.length < minPts) {
      point.clusterId = -1; // Flag as initial Noise
      point.pointType = 'NOISE';
    } else {
      // Point is a Core Point; start expanding the cluster
      point.clusterId = currentClusterId;
      point.pointType = 'CORE';

      const neighborQueue = [...neighbors];

      while (neighborQueue.length > 0) {
        const currentNeighbor = neighborQueue.shift()!;

        if (!visited.has(currentNeighbor.id)) {
          visited.add(currentNeighbor.id);
          const currentNeighborNeighbors = getNeighbors(currentNeighbor);
          if (currentNeighborNeighbors.length >= minPts) {
            currentNeighbor.pointType = 'CORE';
            // Merge unvisited core point's neighbors
            for (const n of currentNeighborNeighbors) {
              if (!neighborQueue.some((q) => q.id === n.id)) {
                neighborQueue.push(n);
              }
            }
          } else {
            currentNeighbor.pointType = 'BORDER';
          }
        }

        // If not assigned to any cluster yet, assign to current cluster
        if (currentNeighbor.clusterId === undefined || currentNeighbor.clusterId === -1) {
          currentNeighbor.clusterId = currentClusterId;
          if (currentNeighbor.pointType !== 'CORE') {
            currentNeighbor.pointType = 'BORDER';
          }
        }
      }

      currentClusterId++;
    }
  }

  // Format and aggregate discovered clusters
  const clusterGroups: Record<number, DBSCANPoint[]> = {};
  const noisePoints: DBSCANPoint[] = [];

  for (const p of dataset) {
    if (p.clusterId === undefined || p.clusterId === -1) {
      noisePoints.push(p);
    } else {
      if (!clusterGroups[p.clusterId]) {
        clusterGroups[p.clusterId] = [];
      }
      clusterGroups[p.clusterId].push(p);
    }
  }

  const clusters = Object.entries(clusterGroups).map(([cIdStr, stalls]) => {
    const cId = parseInt(cIdStr, 10);
    const avgLat = stalls.reduce((sum, s) => sum + s.latitude, 0) / stalls.length;
    const avgLng = stalls.reduce((sum, s) => sum + s.longitude, 0) / stalls.length;

    // Determine dominant locality
    const localityCounts: Record<string, number> = {};
    stalls.forEach((s) => {
      localityCounts[s.locality] = (localityCounts[s.locality] || 0) + 1;
    });
    const dominantLocality = Object.entries(localityCounts).sort((a, b) => b[1] - a[1])[0][0];

    return {
      clusterId: cId,
      clusterName: `${dominantLocality} Street Food Cluster #${cId + 1}`,
      centerLat: Number(avgLat.toFixed(5)),
      centerLng: Number(avgLng.toFixed(5)),
      stallsCount: stalls.length,
      stalls,
      dominantLocality,
    };
  });

  return {
    clusters: clusters.sort((a, b) => b.stallsCount - a.stallsCount),
    noisePoints,
    totalPoints: dataset.length,
    parameters: {
      epsMeters,
      minPts,
    },
  };
}
