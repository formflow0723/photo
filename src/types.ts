export type ScreenRoute =
  | 'home'
  | 'frames'
  | 'frame-detail'
  | 'ai-frame'
  | 'shoot'
  | 'capture'
  | 'result'
  | 'decorate'
  | 'my-photos';

export type FilterType = 'none' | 'mono' | 'warm' | 'cool' | 'film';

export interface DecoItem {
  id: string;
  type: 'sticker' | 'text';
  key?: string;
  text?: string;
  color: string;
  font?: string;
  x: number;
  y: number;
  scale: number;
  rot: number;
}

export interface EditState {
  filterAll: FilterType;
  filters: (FilterType | null)[];
  decos: DecoItem[];
}

export interface ShotItem {
  blob: Blob;
  previewUrl: string;
}

export interface FrameItem {
  id: string;
  name: string;
  category: 'all' | 'anniversary' | 'vibe' | 'fandom' | 'ai';
  categoryLabel: string;
  bgColor: string;
  borderColor: string;
  accentColor: string;
  textColor: string;
  description: string;
  likes: number;
  isAiGenerated?: boolean;
}

export interface PhotoStripItem {
  id: string;
  title: string;
  date: string;
  frameId: string;
  frameName: string;
  frameColor: string;
  likes: number;
}
