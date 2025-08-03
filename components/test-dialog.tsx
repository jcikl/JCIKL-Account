"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function TestDialog() {
  const [open, setOpen] = React.useState(false)

  const handleClick = () => {
    console.log('测试按钮被点击')
    setOpen(true)
    console.log('设置open为true')
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">Dialog功能测试</h2>
      
      <Button onClick={handleClick}>
        打开测试对话框
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>测试对话框</DialogTitle>
            <DialogDescription>
              这是一个测试对话框，用于验证Dialog组件是否正常工作。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <p>如果您能看到这个对话框，说明Dialog组件工作正常。</p>
            <p>当前状态: {open ? '打开' : '关闭'}</p>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                关闭
              </Button>
              <Button onClick={() => setOpen(false)}>
                确定
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 