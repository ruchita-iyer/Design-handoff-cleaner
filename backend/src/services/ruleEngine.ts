export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  fills?: any[];
  strokes?: any[];
  style?: {
    fontFamily?: string;
    fontSize?: number;
    fontWeight?: number;
    lineHeightPx?: number;
  };
  styles?: {
    fill?: string;
    text?: string;
    stroke?: string;
  };
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  category: 'naming' | 'layout' | 'styles' | 'accessibility';
  nodes: string[];
  fix: string;
}

export const analyzeNodes = (nodes: FigmaNode[]): Issue[] => {
  const issues: Issue[] = [];

  const traverse = (node: FigmaNode, depth: number = 0) => {
    // 1. Naming Check
    if (/^(Rectangle|Ellipse|Frame|Group|Vector|Text|Line|Polygon|Star) \d+$/i.test(node.name)) {
      issues.push({
        id: `naming-${node.id}`,
        title: 'Unnamed Layer',
        description: `Layer "${node.name}" uses a default name.`,
        severity: 'medium',
        category: 'naming',
        nodes: [node.name],
        fix: 'Rename the layer to reflect its content (e.g., "Card Header").'
      });
    }

    // 2. Auto-layout Check
    if (node.type === 'FRAME' && node.layoutMode === 'NONE') {
      issues.push({
        id: `autolayout-${node.id}`,
        title: 'Missing Auto-layout',
        description: `Frame "${node.name}" is not using auto-layout.`,
        severity: 'high',
        category: 'layout',
        nodes: [node.name],
        fix: 'Apply Auto-layout (Shift+A) to make it responsive.'
      });
    }

    // 3. Spacing Grid Violation (Check padding and item spacing)
    const spacingValues = [
      (node as any).paddingLeft,
      (node as any).paddingRight,
      (node as any).paddingTop,
      (node as any).paddingBottom,
      (node as any).itemSpacing
    ].filter(v => v !== undefined && v !== 0);

    const hasGridViolation = spacingValues.some(v => v % 4 !== 0);
    if (hasGridViolation) {
      issues.push({
        id: `grid-${node.id}`,
        title: 'Grid Violation',
        description: `Layer "${node.name}" has spacing values that are not multiples of 4.`,
        severity: 'low',
        category: 'layout',
        nodes: [node.name],
        fix: 'Adjust padding and spacing to use 4px or 8px increments.'
      });
    }

    // 4. Excessive Nesting
    if (depth > 5) {
      issues.push({
        id: `nesting-${node.id}`,
        title: 'Excessive Nesting',
        description: `Layer "${node.name}" is nested ${depth} levels deep.`,
        severity: 'medium',
        category: 'layout',
        nodes: [node.name],
        fix: 'Flatten the layer structure to improve performance and developer readability.'
      });
    }

    // 5. Hidden Layers (Clutter)
    if ((node as any).visible === false) {
      issues.push({
        id: `hidden-${node.id}`,
        title: 'Hidden Layer Clutter',
        description: `Layer "${node.name}" is hidden but still exists in the file.`,
        severity: 'low',
        category: 'naming',
        nodes: [node.name],
        fix: 'Delete unused hidden layers to clean up the handoff file.'
      });
    }

    // 6. Hardcoded Colors Check
    if (node.fills && node.fills.length > 0 && !node.styles?.fill) {
      const hasVisibleFill = node.fills.some(f => f.visible !== false && f.type === 'SOLID');
      if (hasVisibleFill) {
        issues.push({
          id: `color-${node.id}`,
          title: 'Hardcoded Color',
          description: `Layer "${node.name}" uses a solid color not linked to a style.`,
          severity: 'low',
          category: 'styles',
          nodes: [node.name],
          fix: 'Link this color to a global color style.'
        });
      }
    }

    // 7. Detached Typography
    if (node.type === 'TEXT' && !node.styles?.text) {
      issues.push({
        id: `typo-${node.id}`,
        title: 'Detached Typography',
        description: `Text layer "${node.name}" does not use a text style.`,
        severity: 'low',
        category: 'styles',
        nodes: [node.name],
        fix: 'Apply a typography style from your design system.'
      });
    }

    // Recursively check children
    if (node.children) {
      node.children.forEach(child => traverse(child, depth + 1));
    }
  };

  nodes.forEach(node => traverse(node));
  return issues;
};
