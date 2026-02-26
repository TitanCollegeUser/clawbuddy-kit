import type { OpsBlock } from '@/hooks/useOpsBlocks';
import { OpsKanbanBlock } from './blocks/OpsKanbanBlock';
import { OpsTableBlock } from './blocks/OpsTableBlock';
import { OpsMetricCardsBlock } from './blocks/OpsMetricCardsBlock';
import { OpsProgressBarBlock } from './blocks/OpsProgressBarBlock';
import { OpsListBlock } from './blocks/OpsListBlock';
import { OpsChartBlock } from './blocks/OpsChartBlock';
import { OpsTextBlock } from './blocks/OpsTextBlock';
import { OpsFeedBlock } from './blocks/OpsFeedBlock';
import { OpsFormBlock } from './blocks/OpsFormBlock';
import { OpsEmbedBlock } from './blocks/OpsEmbedBlock';
import { OpsTimelineBlock } from './blocks/OpsTimelineBlock';
import { OpsAlertBannerBlock } from './blocks/OpsAlertBannerBlock';
import { OpsCountdownBlock } from './blocks/OpsCountdownBlock';
import { OpsAgentCardBlock } from './blocks/OpsAgentCardBlock';
import { OpsCalendarBlock } from './blocks/OpsCalendarBlock';
import { OpsGalleryBlock } from './blocks/OpsGalleryBlock';
import { OpsApprovalQueueBlock } from './blocks/OpsApprovalQueueBlock';
import { OpsComparisonBlock } from './blocks/OpsComparisonBlock';
import { OpsOutreachScoreboardBlock } from './blocks/OpsOutreachScoreboardBlock';
import { OpsOutreachLeadsBlock } from './blocks/OpsOutreachLeadsBlock';
import { OpsOutreachPhoneBlock } from './blocks/OpsOutreachPhoneBlock';
import { OpsOutreachEmailBlock } from './blocks/OpsOutreachEmailBlock';
import { OpsOutreachCampaignsBlock } from './blocks/OpsOutreachCampaignsBlock';
import { OpsOutreachResultsBlock } from './blocks/OpsOutreachResultsBlock';
import { OpsEmployeeCampaignCreatorBlock } from './blocks/OpsEmployeeCampaignCreatorBlock';
import { OpsEmployeeLeadTableBlock } from './blocks/OpsEmployeeLeadTableBlock';
import { OpsEmployeeAnalyticsBlock } from './blocks/OpsEmployeeAnalyticsBlock';
import { OpsMeetingIntelBlock } from './blocks/OpsMeetingIntelBlock';
import { OpsMeetingFeatureBlock } from './blocks/OpsMeetingFeatureBlock';
import { OpsYtDashboardBlock } from './blocks/OpsYtDashboardBlock';
import { OpsYtAnalyticsBlock } from './blocks/OpsYtAnalyticsBlock';
import { OpsYtCompetitorsBlock } from './blocks/OpsYtCompetitorsBlock';
import { OpsYtBangerLabBlock } from './blocks/OpsYtBangerLabBlock';
import { OpsYtPipelineBlock } from './blocks/OpsYtPipelineBlock';
import { OpsYtScriptsBlock } from './blocks/OpsYtScriptsBlock';
import { OpsYtIntelFeedBlock } from './blocks/OpsYtIntelFeedBlock';
import { OpsYtOutlierFeedBlock } from './blocks/OpsYtOutlierFeedBlock';
import { OpsBlockWrapper } from './blocks/OpsBlockWrapper';
import { ResearchHubBlock } from './research-hub/ResearchHubBlock';

const RESEARCH_HUB_APP_ID = '6149611f-1c3b-4906-9c5b-1fa58d0cd7ce';

// Meeting Intelligence feature blocks (Action Items, Proposals, Lead Magnets)
const MEETING_FEATURE_BLOCK_IDS = new Set([
  'c64fdaaf-67e5-49b2-94a3-9d0688e3fae0', // Action Items
  '0dee583a-84aa-4bd6-88fb-93f998e2bfac', // Proposals
  '8622e572-0e4a-427f-bfc6-4fc689009df3', // Lead Magnets
]);

interface Props {
  block: OpsBlock;
  appId: string;
}

const renderBlock = (block: OpsBlock, appId: string) => {
  const props = { block, appId };

  // Research Hub custom rendering
  if (appId === RESEARCH_HUB_APP_ID) {
    return <ResearchHubBlock block={block} appId={appId} />;
  }

  // Meeting Intelligence feature blocks (override generic feed)
  if (MEETING_FEATURE_BLOCK_IDS.has(block.id)) {
    return <OpsMeetingFeatureBlock {...props} />;
  }

  switch (block.block_type) {
    case 'kanban': return <OpsKanbanBlock {...props} />;
    case 'table': return <OpsTableBlock {...props} />;
    case 'metric_cards': return <OpsMetricCardsBlock {...props} />;
    case 'progress_bar': return <OpsProgressBarBlock {...props} />;
    case 'list': return <OpsListBlock {...props} />;
    case 'chart': return <OpsChartBlock {...props} />;
    case 'text': return <OpsTextBlock {...props} />;
    case 'feed': return <OpsFeedBlock {...props} />;
    case 'form': return <OpsFormBlock {...props} />;
    case 'embed': return <OpsEmbedBlock {...props} />;
    case 'timeline': return <OpsTimelineBlock {...props} />;
    case 'alert_banner': return <OpsAlertBannerBlock {...props} />;
    case 'countdown': return <OpsCountdownBlock {...props} />;
    case 'agent_card': return <OpsAgentCardBlock {...props} />;
    case 'calendar': return <OpsCalendarBlock {...props} />;
    case 'gallery': return <OpsGalleryBlock {...props} />;
    case 'approval_queue': return <OpsApprovalQueueBlock {...props} />;
    case 'comparison': return <OpsComparisonBlock {...props} />;
    // Creator Command Centre blocks
    case 'yt_dashboard': return <OpsYtDashboardBlock {...props} />;
    case 'yt_analytics': return <OpsYtAnalyticsBlock {...props} />;
    case 'yt_competitors': return <OpsYtCompetitorsBlock {...props} />;
    case 'yt_banger_lab': return <OpsYtBangerLabBlock {...props} />;
    case 'yt_pipeline': return <OpsYtPipelineBlock {...props} />;
    case 'yt_scripts': return <OpsYtScriptsBlock {...props} />;
    case 'yt_intel_feed': return <OpsYtIntelFeedBlock {...props} />;
    case 'yt_outlier_feed': return <OpsYtOutlierFeedBlock {...props} />;
    // Outreach blocks
    case 'outreach_scoreboard': return <OpsOutreachScoreboardBlock {...props} />;
    case 'outreach_leads': return <OpsOutreachLeadsBlock {...props} />;
    case 'outreach_phone': return <OpsOutreachPhoneBlock {...props} />;
    case 'outreach_email': return <OpsOutreachEmailBlock {...props} />;
    case 'outreach_campaigns': return <OpsOutreachCampaignsBlock {...props} />;
    case 'outreach_results': return <OpsOutreachResultsBlock {...props} />;
    // AI Employee blocks
    case 'employee_campaign_creator': return <OpsEmployeeCampaignCreatorBlock {...props} />;
    case 'employee_lead_table': return <OpsEmployeeLeadTableBlock {...props} />;
    case 'employee_analytics': return <OpsEmployeeAnalyticsBlock {...props} />;
    case 'meeting_intel': return <OpsMeetingIntelBlock {...props} />;
    case 'office':
      return (
        <div className="glass rounded-xl p-6 text-center">
          <p className="text-base text-muted-foreground">Office block — coming soon</p>
        </div>
      );
    default:
      return (
        <div className="glass rounded-xl p-4">
          <p className="text-base text-muted-foreground">Unknown block type: {block.block_type}</p>
        </div>
      );
  }
};

export const OpsBlockRenderer = ({ block, appId }: Props) => {
  return (
    <OpsBlockWrapper block={block} appId={appId}>
      {renderBlock(block, appId)}
    </OpsBlockWrapper>
  );
};
