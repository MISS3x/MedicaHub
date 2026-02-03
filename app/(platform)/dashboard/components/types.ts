
export type NodeType = 'brain' | 'app';

export interface NodePosition {
    x: number;
    y: number;
}

export interface DashboardNode {
    id: string;
    type: NodeType;
    label: string;
    color?: string;
    initialX?: number;
    initialY?: number;
}

export type LayoutMap = Record<string, NodePosition>;
