import React from 'react';

interface FloatingWidgetProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  id?: string;
  visible?: boolean;
}

export const FloatingWidget: React.FC<FloatingWidgetProps> = ({ children, style, className, id, visible = true }) => {
  if (!visible) return null;
  return (
    <div
      id={id}
      className={`floating-widget fixed z-40 backdrop-blur-sm ${className || ''}`}
      style={{
        borderRadius: 20,
        padding: 12,
        background: 'rgba(6,8,15,0.66)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 8px 40px rgba(2,6,23,0.6)',
        transition: 'transform 240ms ease, opacity 240ms ease',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default FloatingWidget;
