"use client";
import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

export function LinksManager() {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", path: "", description: "", category: "" });
  const [editForm, setEditForm] = useState({ id: "", title: "", path: "", description: "", category: "" });
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // 拉取所有链接
  const fetchLinks = async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "links"));
    setLinks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  // 添加新链接
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.path) return;
    await addDoc(collection(db, "links"), form);
    setForm({ title: "", path: "", description: "", category: "" });
    fetchLinks();
  };

  // 删除链接
  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteDoc(doc(db, "links", deleteId));
    setDeleteId(null);
    setDeleteConfirmOpen(false);
    fetchLinks();
  };

  // 打开编辑弹窗
  const openEdit = (link: any) => {
    setEditForm({ ...link });
    setEditOpen(true);
  };

  // 编辑保存
  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.id || !editForm.title || !editForm.path) return;
    await updateDoc(doc(db, "links", editForm.id), {
      title: editForm.title,
      path: editForm.path,
      description: editForm.description,
      category: editForm.category,
    });
    setEditOpen(false);
    fetchLinks();
  };

  // 对 links 按 category 分组
  const groupedLinks = links.reduce((acc, link) => {
    const cat = link.category || "未分类";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(link);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>链接管理</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAdd} className="flex gap-2 mb-4 flex-wrap">
          <div>
            <Label>名称</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div>
            <Label>路径</Label>
            <Input value={form.path} onChange={e => setForm(f => ({ ...f, path: e.target.value }))} required />
          </div>
          <div>
            <Label>描述</Label>
            <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <Label>分类</Label>
            <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
          </div>
          <Button type="submit" className="self-end">添加</Button>
        </form>
        <Button onClick={fetchLinks} size="sm" variant="outline" className="mb-2">刷新</Button>
        {loading ? <div>加载中...</div> : (
          <div className="space-y-4">
            {Object.entries(groupedLinks).map(([cat, catLinks]) => (
              <Card key={cat} className="mb-4 border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg">{cat}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {catLinks.map(link => (
                      <div key={link.id} className="p-2 border rounded flex flex-col md:flex-row md:items-center gap-2">
                        <div className="font-bold">{link.title}</div>
                        <div className="text-xs text-muted-foreground">{link.path}</div>
                        <div className="text-xs">{link.description}</div>
                        <a href={link.path} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline ml-auto">访问</a>
                        <Button size="sm" variant="outline" onClick={() => openEdit(link)}>编辑</Button>
                        <Button size="sm" variant="destructive" onClick={() => { setDeleteId(link.id); setDeleteConfirmOpen(true); }}>删除</Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {/* 编辑弹窗 */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑链接</DialogTitle>
              <DialogDescription>修改链接信息后保存</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSave} className="space-y-2">
              <div>
                <Label>名称</Label>
                <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div>
                <Label>路径</Label>
                <Input value={editForm.path} onChange={e => setEditForm(f => ({ ...f, path: e.target.value }))} required />
              </div>
              <div>
                <Label>描述</Label>
                <Input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <Label>分类</Label>
                <Input value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>取消</Button>
                <Button type="submit">保存</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        {/* 删除确认弹窗 */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认删除</DialogTitle>
              <DialogDescription>确定要删除此链接吗？此操作不可撤销。</DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>取消</Button>
              <Button variant="destructive" onClick={handleDelete}>删除</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}