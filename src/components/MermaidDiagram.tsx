import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidDiagramProps {
  bulletPoints: string[];
  title: string;
}

// Initialize mermaid with a theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    primaryColor: 'hsl(var(--primary))',
    primaryTextColor: 'hsl(var(--primary-foreground))',
    primaryBorderColor: 'hsl(var(--primary))',
    lineColor: 'hsl(var(--muted-foreground))',
    secondaryColor: 'hsl(var(--muted))',
    tertiaryColor: 'hsl(var(--background))',
    fontSize: '12px',
  },
  flowchart: {
    curve: 'basis',
    padding: 10,
  },
});

// Generate a mermaid flowchart from bullet points
const generateMermaidCode = (bulletPoints: string[], title: string): string => {
  // Sanitize text for mermaid (remove special chars that break syntax)
  const sanitize = (text: string) => {
    return text
      .replace(/["\[\]{}()]/g, '')
      .replace(/&/g, 'and')
      .replace(/</g, '')
      .replace(/>/g, '')
      .substring(0, 40) + (text.length > 40 ? '...' : '');
  };

  const shortTitle = sanitize(title).substring(0, 20);
  
  if (bulletPoints.length <= 2) {
    // Simple linear flow for 1-2 points
    let code = 'flowchart TB\n';
    code += `  A[("${shortTitle}")]\n`;
    bulletPoints.forEach((point, i) => {
      const nodeId = String.fromCharCode(66 + i); // B, C, D...
      const prevId = i === 0 ? 'A' : String.fromCharCode(65 + i);
      code += `  ${prevId} --> ${nodeId}["${sanitize(point)}"]\n`;
    });
    return code;
  } else {
    // Mind map style - central node with branches
    let code = 'flowchart TB\n';
    code += `  CENTER(("${shortTitle}"))\n`;
    bulletPoints.forEach((point, i) => {
      const nodeId = `N${i}`;
      code += `  CENTER --> ${nodeId}["${sanitize(point)}"]\n`;
    });
    return code;
  }
};

export const MermaidDiagram = ({ bulletPoints, title }: MermaidDiagramProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;
      
      try {
        const mermaidCode = generateMermaidCode(bulletPoints, title);
        const id = `mermaid-${Date.now()}`;
        
        // Clear previous content
        containerRef.current.innerHTML = '';
        
        const { svg } = await mermaid.render(id, mermaidCode);
        containerRef.current.innerHTML = svg;
        setError(false);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError(true);
      }
    };

    renderDiagram();
  }, [bulletPoints, title]);

  if (error) {
    return (
      <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-center min-h-[120px]">
        <p className="text-xs text-muted-foreground">Unable to generate diagram</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="bg-muted/30 rounded-lg p-4 flex items-center justify-center min-h-[120px] overflow-hidden [&_svg]:max-w-full [&_svg]:h-auto"
    />
  );
};
