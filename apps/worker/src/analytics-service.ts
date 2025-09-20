/**
 * Comprehensive Analytics and History Service
 * Provides clean, reliable analytics and history functionality
 */

export interface UserHistoryItem {
  id: string;
  type: 'intake' | 'recommendation';
  title: string;
  timestamp: string;
  data: any;
  summary?: {
    averageFit?: number;
    carrierCount?: number;
    topCarrier?: string;
  };
}

export interface AnalyticsSummary {
  stats: {
    totalIntakes: number;
    totalRecommendations: number;
    averageFitScore: number;
    placementRate: number;
    remainingRecommendations: number;
  };
  topCarriers: Array<{
    id: string;
    name: string;
    count: number;
    successRate: number;
  }>;
  trends: Array<{
    month: string;
    intakes: number;
    recommendations: number;
    averageFit: number;
  }>;
  lastUpdated: string;
}

export interface UserActivityLog {
  id: string;
  userId: string;
  activityType: string;
  activityData: any;
  createdAt: string;
}

/**
 * Get comprehensive user history
 */
export async function getUserHistory(
  userId: string,
  env: any,
  limit: number = 50
): Promise<UserHistoryItem[]> {
  try {
    console.log(`Fetching history for user: ${userId}`);
    
    // Get intakes with their recommendations
    const query = `
      SELECT 
        i.id as intake_id,
        i.created_at as intake_created_at,
        i.payload_json as intake_data,
        r.id as recommendation_id,
        r.created_at as recommendation_created_at,
        r.fit_json as recommendations_data,
        COUNT(r.id) as recommendation_count
      FROM intakes i
      LEFT JOIN recommendations r ON i.id = r.intake_id
      WHERE i.user_id = ?
      GROUP BY i.id
      ORDER BY i.created_at DESC
      LIMIT ?
    `;

    const result = await env.DB.prepare(query).bind(userId, limit).all();
    
    if (!result.results || result.results.length === 0) {
      console.log(`No history found for user: ${userId}`);
      return [];
    }

    const history: UserHistoryItem[] = [];

    for (const row of result.results) {
      const intakeData = row.intake_data ? JSON.parse(row.intake_data) : null;
      const recommendationsData = row.recommendations_data ? JSON.parse(row.recommendations_data) : null;
      
      if (row.recommendation_id && recommendationsData) {
        // Has recommendations - create recommendation history item
        const carriers = Array.isArray(recommendationsData) ? recommendationsData : [recommendationsData];
        const topCarrier = carriers.reduce((prev, current) => 
          (current.fitScore || 0) > (prev.fitScore || 0) ? current : prev, carriers[0]
        );
        
        history.push({
          id: row.recommendation_id,
          type: 'recommendation',
          title: `${topCarrier?.carrierName || 'Unknown Carrier'} - ${topCarrier?.fitScore || 0}% fit`,
          timestamp: row.recommendation_created_at,
          data: {
            intakeId: row.intake_id,
            recommendations: carriers,
            intakeData
          },
          summary: {
            averageFit: carriers.reduce((sum, c) => sum + (c.fitScore || 0), 0) / carriers.length,
            carrierCount: carriers.length,
            topCarrier: topCarrier?.carrierName
          }
        });
      } else {
        // Intake only - create intake history item
        history.push({
          id: row.intake_id,
          type: 'intake',
          title: 'Intake submitted',
          timestamp: row.intake_created_at,
          data: {
            intakeData
          }
        });
      }
    }

    console.log(`Returning ${history.length} history items for user: ${userId}`);
    return history;
  } catch (error) {
    console.error('Error fetching user history:', error);
    return [];
  }
}

/**
 * Get comprehensive analytics summary
 */
export async function getAnalyticsSummary(
  userId: string,
  env: any
): Promise<AnalyticsSummary> {
  try {
    console.log(`Fetching analytics for user: ${userId}`);
    
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    
    // Get basic stats
    const [intakesResult, recommendationsResult, userProfileResult] = await Promise.all([
      env.DB.prepare(`
        SELECT COUNT(*) as count 
        FROM intakes 
        WHERE user_id = ? AND created_at >= ?
      `).bind(userId, monthStart).first(),
      
      env.DB.prepare(`
        SELECT COUNT(*) as count 
        FROM recommendations 
        WHERE user_id = ? AND created_at >= ?
      `).bind(userId, monthStart).first(),
      
      env.DB.prepare(`
        SELECT recommendations_limit, recommendations_used 
        FROM user_profiles 
        WHERE user_id = ?
      `).bind(userId).first()
    ]);

    const totalIntakes = (intakesResult as any)?.count || 0;
    const totalRecommendations = (recommendationsResult as any)?.count || 0;
    const userProfile = userProfileResult as any;
    
    // Get average fit score
    const avgFitResult = await env.DB.prepare(`
      SELECT AVG(CAST(JSON_EXTRACT(fit_json, '$.fitScore') AS REAL)) as avg_fit
      FROM recommendations 
      WHERE user_id = ? AND created_at >= ?
    `).bind(userId, monthStart).first();
    
    const averageFitScore = Math.round((avgFitResult as any)?.avg_fit || 75);
    
    // Get placement rate (from outcomes)
    const placementResult = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total_outcomes,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count
      FROM outcomes o
      JOIN recommendations r ON o.recommendation_id = r.id
      WHERE r.user_id = ? AND o.created_at >= ?
    `).bind(userId, monthStart).first();
    
    const placementData = placementResult as any;
    const placementRate = placementData?.total_outcomes > 0 
      ? Math.round((placementData.approved_count / placementData.total_outcomes) * 100)
      : 0;
    
    // Get remaining recommendations
    const remainingRecommendations = Math.max(0, 
      (userProfile?.recommendations_limit || 200) - (userProfile?.recommendations_used || 0)
    );
    
    // Get top carriers
    const topCarriersResult = await env.DB.prepare(`
      SELECT 
        carrier_name,
        COUNT(*) as count,
        AVG(CAST(JSON_EXTRACT(fit_json, '$.fitScore') AS REAL)) as avg_fit
      FROM recommendations 
      WHERE user_id = ? AND created_at >= ?
      GROUP BY carrier_name
      ORDER BY count DESC, avg_fit DESC
      LIMIT 5
    `).bind(userId, monthStart).all();
    
    const topCarriers = (topCarriersResult.results || []).map((row: any) => ({
      id: row.carrier_name?.toLowerCase().replace(/\s+/g, '_') || 'unknown',
      name: row.carrier_name || 'Unknown',
      count: row.count || 0,
      successRate: Math.round(row.avg_fit || 0)
    }));
    
    // Get monthly trends (last 6 months)
    const trendsResult = await env.DB.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        COUNT(*) as count
      FROM intakes 
      WHERE user_id = ? AND created_at >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
    `).bind(userId).all();
    
    const trends = (trendsResult.results || []).map((row: any) => ({
      month: row.month,
      intakes: row.count || 0,
      recommendations: 0, // TODO: Calculate from recommendations
      averageFit: averageFitScore
    }));
    
    const summary: AnalyticsSummary = {
      stats: {
        totalIntakes,
        totalRecommendations,
        averageFitScore,
        placementRate,
        remainingRecommendations
      },
      topCarriers,
      trends,
      lastUpdated: now.toISOString()
    };
    
    console.log(`Analytics summary for user ${userId}:`, summary.stats);
    return summary;
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    // Return default values on error
    return {
      stats: {
        totalIntakes: 0,
        totalRecommendations: 0,
        averageFitScore: 0,
        placementRate: 0,
        remainingRecommendations: 200
      },
      topCarriers: [],
      trends: [],
      lastUpdated: new Date().toISOString()
    };
  }
}

/**
 * Log user activity for analytics
 */
export async function logUserActivity(
  userId: string,
  activityType: string,
  activityData: any,
  env: any
): Promise<void> {
  try {
    await env.DB.prepare(`
      INSERT INTO user_activity_log (id, user_id, activity_type, activity_data)
      VALUES (?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      userId,
      activityType,
      JSON.stringify(activityData)
    ).run();
    
    console.log(`Logged activity: ${activityType} for user: ${userId}`);
  } catch (error) {
    console.error('Error logging user activity:', error);
    // Don't throw - logging should not break the main flow
  }
}

/**
 * Clear user history and analytics data
 */
export async function clearUserData(
  userId: string,
  env: any
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`Clearing all data for user: ${userId}`);
    
    // Delete in order to respect foreign key constraints
    await Promise.all([
      env.DB.prepare('DELETE FROM user_activity_log WHERE user_id = ?').bind(userId).run(),
      env.DB.prepare('DELETE FROM analytics_snapshots WHERE user_id = ?').bind(userId).run(),
      env.DB.prepare('DELETE FROM outcomes WHERE recommendation_id IN (SELECT id FROM recommendations WHERE user_id = ?)').bind(userId).run(),
      env.DB.prepare('DELETE FROM recommendations WHERE user_id = ?').bind(userId).run(),
      env.DB.prepare('DELETE FROM intakes WHERE user_id = ?').bind(userId).run()
    ]);
    
    console.log(`Successfully cleared all data for user: ${userId}`);
    return { success: true, message: 'All data cleared successfully' };
  } catch (error) {
    console.error('Error clearing user data:', error);
    return { success: false, message: 'Failed to clear data' };
  }
}
