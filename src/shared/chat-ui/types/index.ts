/**
 * Shared types for reusable chat UI components
 * Used by both student career-assistant and educator-copilot
 */

export interface BaseMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface InteractiveData {
  cards?: InteractiveCard[];
  quickActions?: QuickAction[];
  suggestions?: SuggestedAction[];
  visualData?: any;
  metadata?: MessageMetadata;
}

export interface MessageWithInteractive extends BaseMessage {
  interactive?: InteractiveData;
}

export interface InteractiveCard {
  id: string;
  type: string;
  data: any;
  actions?: ActionButton[];
}

export interface ActionButton {
  id: string;
  label: string;
  action: {
    type: 'query' | 'navigate' | 'external' | 'function';
    value: string;
    data?: any;
  };
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'outline' | 'ghost';
  icon?: string;
  disabled?: boolean;
  tooltip?: string;
}

export interface QuickAction extends ActionButton {}

export interface SuggestedAction {
  id: string;
  label: string;
  query: string;
  icon?: string;
}

export interface MessageMetadata {
  encouragement?: string;
  nextSteps?: string[];
  intentHandled?: string;
}

export interface WelcomeConfig {
  title: string;
  subtitle: string;
  quickActions: QuickActionChip[];
}

export interface QuickActionChip {
  id: string;
  label: string;
  icon: string;
  query: string;
  gradient: string;
}

export interface ChatConfig {
  welcomeConfig: WelcomeConfig;
  placeholder: string;
  enableVoice?: boolean;
  enableAttachments?: boolean;
}

export interface ChatHandlers {
  onSendMessage: (message: string) => Promise<void>;
  onActionClick?: (action: ActionButton) => void;
  onSuggestionClick?: (suggestion: SuggestedAction) => void;
}

export interface CardRendererProps {
  card: InteractiveCard;
  onAction: (action: ActionButton) => void;
}

export type CardRenderer = (props: CardRendererProps) => JSX.Element;
