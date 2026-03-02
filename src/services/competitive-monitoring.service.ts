// services/competitive-monitoring.service.ts
export class CompetitiveMonitoringService {
  private changeDetectors = new Map<string, ChangeDetector>();

  async startMonitoring(competitorId: string): Promise<void> {
    const competitor = await this.getCompetitor(competitorId);
    
    // Create change detector
    const detector = new ChangeDetector({
      url: competitor.website_url,
      checkInterval: 24 * 60 * 60 * 1000, // Daily
      elements: [
        { selector: '.pricing', type: 'pricing' },
        { selector: '.features', type: 'features' },
        { selector: '.news', type: 'announcements' }
      ]
    });

    detector.on('change', (change) => this.handleCompetitorChange(competitorId, change));
    this.changeDetectors.set(competitorId, detector);
    detector.start();
  }

  private async handleCompetitorChange(competitorId: string, change: Change): Promise<void> {
    // Create alert
    const alert = await this.createCompetitiveAlert({
      competitor_id: competitorId,
      alert_type: change.type,
      description: change.description,
      severity: this.calculateSeverity(change),
      changes: change.details
    });

    // Notify user
    await this.notifyUser(alert);

    // Update competitor analysis
    await this.updateCompetitorAnalysis(competitorId);
  }
}