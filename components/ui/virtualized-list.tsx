// components/ui/virtualized-list.tsx
import React from 'react'
import { FixedSizeList as List } from 'react-window'
import { VariableSizeList as VariableList } from 'react-window'
import { areEqual } from 'react-window'

// 固定高度虚拟化列表
interface FixedSizeListProps<T> {
  items: T[]
  height: number
  itemHeight: number
  width?: number | string
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  overscanCount?: number
}

export function VirtualizedFixedList<T>({
  items,
  height,
  itemHeight,
  width = '100%',
  renderItem,
  className,
  overscanCount = 5
}: FixedSizeListProps<T>) {
  const Row = React.memo(({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      {renderItem(items[index], index)}
    </div>
  ), areEqual)

  return (
    <List
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width={width}
      className={className}
      overscanCount={overscanCount}
    >
      {Row}
    </List>
  )
}

// 可变高度虚拟化列表
interface VariableSizeListProps<T> {
  items: T[]
  height: number
  width?: number | string
  getItemHeight: (index: number) => number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  overscanCount?: number
}

export function VirtualizedVariableList<T>({
  items,
  height,
  width = '100%',
  getItemHeight,
  renderItem,
  className,
  overscanCount = 5
}: VariableSizeListProps<T>) {
  const Row = React.memo(({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      {renderItem(items[index], index)}
    </div>
  ), areEqual)

  return (
    <VariableList
      height={height}
      itemCount={items.length}
      itemSize={getItemHeight}
      width={width}
      className={className}
      overscanCount={overscanCount}
    >
      {Row}
    </VariableList>
  )
}

// 自动高度虚拟化列表
interface AutoSizeListProps<T> {
  items: T[]
  maxHeight: number
  width?: number | string
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  estimatedItemHeight?: number
}

export function VirtualizedAutoList<T>({
  items,
  maxHeight,
  width = '100%',
  renderItem,
  className,
  estimatedItemHeight = 50
}: AutoSizeListProps<T>) {
  const [listHeight, setListHeight] = React.useState(maxHeight)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const containerHeight = containerRef.current.clientHeight
        setListHeight(Math.min(containerHeight, maxHeight))
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [maxHeight])

  const Row = React.memo(({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      {renderItem(items[index], index)}
    </div>
  ), areEqual)

  return (
    <div ref={containerRef} style={{ height: maxHeight, width }}>
      <List
        height={listHeight}
        itemCount={items.length}
        itemSize={estimatedItemHeight}
        width="100%"
        className={className}
      >
        {Row}
      </List>
    </div>
  )
}

// 虚拟化表格
interface VirtualizedTableProps<T> {
  items: T[]
  height: number
  width?: number | string
  columns: Array<{
    key: string
    title: string
    width: number
    render: (item: T, index: number) => React.ReactNode
  }>
  className?: string
  headerHeight?: number
  rowHeight?: number
}

export function VirtualizedTable<T>({
  items,
  height,
  width = '100%',
  columns,
  className,
  headerHeight = 40,
  rowHeight = 50
}: VirtualizedTableProps<T>) {
  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0)

  const Header = () => (
    <div className="flex border-b bg-gray-50 font-medium text-sm">
      {columns.map((column) => (
        <div
          key={column.key}
          className="px-4 py-2 flex items-center"
          style={{ width: column.width }}
        >
          {column.title}
        </div>
      ))}
    </div>
  )

  const Row = React.memo(({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style} className="flex border-b hover:bg-gray-50">
      {columns.map((column) => (
        <div
          key={column.key}
          className="px-4 py-2 flex items-center"
          style={{ width: column.width }}
        >
          {column.render(items[index], index)}
        </div>
      ))}
    </div>
  ), areEqual)

  return (
    <div className={className} style={{ width }}>
      <Header />
      <List
        height={height - headerHeight}
        itemCount={items.length}
        itemSize={rowHeight}
        width={totalWidth}
      >
        {Row}
      </List>
    </div>
  )
}

// 虚拟化网格
interface VirtualizedGridProps<T> {
  items: T[]
  height: number
  width?: number | string
  columnCount: number
  columnWidth: number
  rowHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
}

export function VirtualizedGrid<T>({
  items,
  height,
  width = '100%',
  columnCount,
  columnWidth,
  rowHeight,
  renderItem,
  className
}: VirtualizedGridProps<T>) {
  const Row = React.memo(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const startIndex = index * columnCount
    const endIndex = Math.min(startIndex + columnCount, items.length)

    return (
      <div style={style} className="flex">
        {Array.from({ length: columnCount }, (_, columnIndex) => {
          const itemIndex = startIndex + columnIndex
          if (itemIndex >= items.length) {
            return <div key={columnIndex} style={{ width: columnWidth }} />
          }
          return (
            <div key={columnIndex} style={{ width: columnWidth }}>
              {renderItem(items[itemIndex], itemIndex)}
            </div>
          )
        })}
      </div>
    )
  }, areEqual)

  const rowCount = Math.ceil(items.length / columnCount)

  return (
    <List
      height={height}
      itemCount={rowCount}
      itemSize={rowHeight}
      width={width}
      className={className}
    >
      {Row}
    </List>
  )
}

// 性能优化的虚拟化列表Hook
export function useVirtualizedList<T>(
  items: T[],
  options: {
    itemHeight?: number
    estimatedItemHeight?: number
    overscanCount?: number
  } = {}
) {
  const {
    itemHeight = 50,
    estimatedItemHeight = 50,
    overscanCount = 5
  } = options

  const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: 0 })
  const [containerHeight, setContainerHeight] = React.useState(0)

  const onScroll = React.useCallback(({ scrollOffset, scrollUpdateWasRequested }: any) => {
    if (!scrollUpdateWasRequested) {
      const start = Math.floor(scrollOffset / itemHeight)
      const end = Math.min(start + Math.ceil(containerHeight / itemHeight) + overscanCount, items.length)
      setVisibleRange({ start, end })
    }
  }, [itemHeight, containerHeight, overscanCount, items.length])

  const getVisibleItems = React.useCallback(() => {
    return items.slice(visibleRange.start, visibleRange.end)
  }, [items, visibleRange])

  return {
    visibleRange,
    visibleItems: getVisibleItems(),
    onScroll,
    setContainerHeight,
    totalHeight: items.length * itemHeight
  }
} 