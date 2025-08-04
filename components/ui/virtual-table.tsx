"use client"

import * as React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface VirtualTableProps<T> {
  data: T[]
  columns: {
    key: string
    header: string
    width?: number
    render: (item: T, index: number) => React.ReactNode
  }[]
  height?: number
  itemHeight?: number
  className?: string
  onRowClick?: (item: T, index: number) => void
  selectedRows?: Set<string>
  getRowId?: (item: T) => string
}

export function VirtualTable<T>({
  data,
  columns,
  height = 400,
  itemHeight = 50,
  className = "",
  onRowClick,
  selectedRows,
  getRowId
}: VirtualTableProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
  })

  const handleRowClick = React.useCallback((item: T, index: number) => {
    onRowClick?.(item, index)
  }, [onRowClick])

  const isRowSelected = React.useCallback((item: T) => {
    if (!selectedRows || !getRowId) return false
    return selectedRows.has(getRowId(item))
  }, [selectedRows, getRowId])

  return (
    <div 
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
    >
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead 
                key={column.key}
                style={{ width: column.width }}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const item = data[virtualRow.index]
            const isSelected = isRowSelected(item)
            
            return (
              <TableRow
                key={virtualRow.index}
                className={`${
                  isSelected ? "bg-muted" : ""
                } ${
                  onRowClick ? "cursor-pointer hover:bg-muted/50" : ""
                }`}
                onClick={() => handleRowClick(item, virtualRow.index)}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {columns.map((column) => (
                  <TableCell key={column.key}>
                    {column.render(item, virtualRow.index)}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

// 虚拟滚动列表组件
interface VirtualListProps<T> {
  data: T[]
  height?: number
  itemHeight?: number
  className?: string
  renderItem: (item: T, index: number) => React.ReactNode
  onItemClick?: (item: T, index: number) => void
  selectedItems?: Set<string>
  getItemId?: (item: T) => string
}

export function VirtualList<T>({
  data,
  height = 400,
  itemHeight = 50,
  className = "",
  renderItem,
  onItemClick,
  selectedItems,
  getItemId
}: VirtualListProps<T>) {
  const parentRef = React.useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5,
  })

  const handleItemClick = React.useCallback((item: T, index: number) => {
    onItemClick?.(item, index)
  }, [onItemClick])

  const isItemSelected = React.useCallback((item: T) => {
    if (!selectedItems || !getItemId) return false
    return selectedItems.has(getItemId(item))
  }, [selectedItems, getItemId])

  return (
    <div 
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const item = data[virtualRow.index]
          const isSelected = isItemSelected(item)
          
          return (
            <div
              key={virtualRow.index}
              className={`${
                isSelected ? "bg-muted" : ""
              } ${
                onItemClick ? "cursor-pointer hover:bg-muted/50" : ""
              }`}
              onClick={() => handleItemClick(item, virtualRow.index)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderItem(item, virtualRow.index)}
            </div>
          )
        })}
      </div>
    </div>
  )
} 