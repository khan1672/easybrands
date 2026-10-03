import type { SuggestedProduct } from '@services/api/chatApi';
import type { ChatTurn } from './hooks/useChat';

export type { ChatTurn, SuggestedProduct };
export type TurnProductPress = (product: SuggestedProduct) => void;
