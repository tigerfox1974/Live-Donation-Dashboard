import React, { forwardRef, memo, useCallback, CSSProperties } from 'react';
import { FixedSizeList } from 'react-window';
import type { ListChildComponentProps } from 'react-window';

// ============ Generic Virtualized List ============
interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  width?: number | string;
  renderItem: (item: T, index: number, style: CSSProperties) => React.ReactNode;
  className?: string;
  overscanCount?: number;
}

function VirtualizedListInner<T>({
  items,
  height,
  itemHeight,
  width = '100%',
  renderItem,
  className,
  overscanCount = 5
}: VirtualizedListProps<T>) {
  const Row = useCallback(
    ({ index, style }: ListChildComponentProps) => {
      const item = items[index];
      return <>{renderItem(item, index, style)}</>;
    },
    [items, renderItem]
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <FixedSizeList
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width={width}
      className={className}
      overscanCount={overscanCount}
    >
      {Row}
    </FixedSizeList>
  );
}

export const VirtualizedList = memo(VirtualizedListInner) as typeof VirtualizedListInner;

// ============ Virtualized Table Body ============
interface VirtualizedTableProps<T> {
  items: T[];
  height: number;
  rowHeight: number;
  renderRow: (item: T, index: number, style: CSSProperties) => React.ReactNode;
  className?: string;
  overscanCount?: number;
}

// Inner element to preserve table structure
const TableInnerElement = forwardRef<HTMLDivElement, { style: CSSProperties; children?: React.ReactNode }>(
  ({ style, children, ...rest }, ref) => (
    <div ref={ref} style={style} {...rest} role="rowgroup">
      {children}
    </div>
  )
);
TableInnerElement.displayName = 'TableInnerElement';

export function VirtualizedTableBody<T>({
  items,
  height,
  rowHeight,
  renderRow,
  className,
  overscanCount = 5
}: VirtualizedTableProps<T>) {
  const Row = useCallback(
    ({ index, style }: ListChildComponentProps) => {
      const item = items[index];
      return <>{renderRow(item, index, style)}</>;
    },
    [items, renderRow]
  );

  if (items.length === 0) {
    return null;
  }

  // Calculate actual height - cap at container or use actual content height
  const actualHeight = Math.min(height, items.length * rowHeight);

  return (
    <FixedSizeList
      height={actualHeight}
      itemCount={items.length}
      itemSize={rowHeight}
      width="100%"
      className={className}
      overscanCount={overscanCount}
      innerElementType={TableInnerElement}
    >
      {Row}
    </FixedSizeList>
  );
}

// ============ Virtualized Card List ============
interface VirtualizedCardListProps<T> {
  items: T[];
  height: number;
  cardHeight: number;
  gap?: number;
  renderCard: (item: T, index: number) => React.ReactNode;
  emptyMessage?: React.ReactNode;
  className?: string;
}

export function VirtualizedCardList<T>({
  items,
  height,
  cardHeight,
  gap = 16,
  renderCard,
  emptyMessage,
  className
}: VirtualizedCardListProps<T>) {
  const itemSize = cardHeight + gap;
  
  const Row = useCallback(
    ({ index, style }: ListChildComponentProps) => {
      const item = items[index];
      return (
        <div
          style={{
            ...style,
            height: cardHeight,
            paddingBottom: gap
          }}
        >
          {renderCard(item, index)}
        </div>
      );
    },
    [items, renderCard, cardHeight, gap]
  );

  if (items.length === 0) {
    return <>{emptyMessage}</>;
  }

  const actualHeight = Math.min(height, items.length * itemSize);

  return (
    <FixedSizeList
      height={actualHeight}
      itemCount={items.length}
      itemSize={itemSize}
      width="100%"
      className={className}
      overscanCount={3}
    >
      {Row}
    </FixedSizeList>
  );
}

// ============ Constants for row heights ============
export const ROW_HEIGHTS = {
  PARTICIPANT_ROW: 64,
  DONATION_CARD: 88,
  EVENT_ROW: 56,
  ITEM_ROW: 80,
  QUEUE_CARD: 96
} as const;

// ============ Auto-height virtualized list ============
// Uses window resize observer to set height
import { useState, useEffect, useRef } from 'react';

interface AutoHeightVirtualizedListProps<T> extends Omit<VirtualizedListProps<T>, 'height'> {
  maxHeight?: number;
  minHeight?: number;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export function AutoHeightVirtualizedList<T>({
  items,
  itemHeight,
  maxHeight = 600,
  minHeight = 200,
  containerRef: externalContainerRef,
  ...props
}: AutoHeightVirtualizedListProps<T>) {
  const internalRef = useRef<HTMLDivElement>(null);
  const containerRef = externalContainerRef || internalRef;
  const [height, setHeight] = useState(maxHeight);

  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top - 100; // 100px buffer for footer/margins
        const calculatedHeight = Math.max(minHeight, Math.min(maxHeight, availableHeight));
        setHeight(calculatedHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [containerRef, maxHeight, minHeight]);

  return (
    <div ref={internalRef}>
      <VirtualizedList
        items={items}
        height={height}
        itemHeight={itemHeight}
        {...props}
      />
    </div>
  );
}
