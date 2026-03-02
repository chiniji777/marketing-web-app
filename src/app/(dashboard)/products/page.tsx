"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/shared/page-header"
import { StatCard } from "@/components/shared/stat-card"
import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Package,
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Eye,
  Edit,
  Target,
  TrendingUp,
  BarChart3,
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { getProducts, getProductStats, deleteProduct, updateProduct } from "@/server/actions/product"

const STATUS_OPTIONS = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "DRAFT", label: "แบบร่าง" },
  { value: "ACTIVE", label: "เปิดใช้งาน" },
  { value: "ARCHIVED", label: "เก็บถาวร" },
]

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "แบบร่าง", variant: "secondary" },
  ACTIVE: { label: "เปิดใช้งาน", variant: "default" },
  ARCHIVED: { label: "เก็บถาวร", variant: "outline" },
}

interface ProductRow {
  id: string
  name: string
  description: string | null
  category: string | null
  price: number | null
  currency: string
  status: string
  marketingDataScore: number
  createdAt: string
  updatedAt: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([])
  const [stats, setStats] = useState({ total: 0, active: 0, draft: 0, withAds: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [productsData, statsData] = await Promise.all([
        getProducts({
          status: status === "all" ? undefined : status,
          search: search || undefined,
          page,
        }),
        getProductStats(),
      ])
      setProducts(productsData.products as unknown as ProductRow[])
      setTotalPages(productsData.totalPages)
      setStats(statsData)
    } catch {
      toast.error("ไม่สามารถโหลดข้อมูลสินค้าได้")
    } finally {
      setLoading(false)
    }
  }, [status, search, page])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id)
      toast.success("ลบสินค้าเรียบร้อย")
      loadData()
    } catch {
      toast.error("ไม่สามารถลบสินค้าได้")
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateProduct({ id, status: newStatus as "DRAFT" | "ACTIVE" | "ARCHIVED" })
      toast.success("อัปเดตสถานะเรียบร้อย")
      loadData()
    } catch {
      toast.error("ไม่สามารถอัปเดตสถานะได้")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        heading="สินค้า"
        description="จัดการสินค้าและข้อมูลการตลาดสำหรับโฆษณา"
      >
        <Link href="/products/create">
          <Button>
            <Sparkles className="mr-2 h-4 w-4" />
            สร้างสินค้าใหม่ (AI)
          </Button>
        </Link>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="สินค้าทั้งหมด" value={String(stats.total)} icon={Package} />
        <StatCard title="เปิดใช้งาน" value={String(stats.active)} icon={TrendingUp} />
        <StatCard title="แบบร่าง" value={String(stats.draft)} icon={Edit} />
        <StatCard title="มีแคมเปญโฆษณา" value={String(stats.withAds)} icon={Target} />
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ค้นหาสินค้า..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="ยังไม่มีสินค้า"
          description="สร้างสินค้าแรกของคุณ แล้วให้ AI ช่วยรวบรวมข้อมูลการตลาด"
        >
          <Link href="/products/create">
            <Button>
              <Sparkles className="mr-2 h-4 w-4" />
              สร้างสินค้าใหม่ (AI)
            </Button>
          </Link>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {products.map((product) => {
            const badgeInfo = STATUS_BADGE[product.status] || STATUS_BADGE.DRAFT
            return (
              <Card key={product.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <Link href={`/products/${product.id}`} className="font-semibold hover:underline">
                        {product.name}
                      </Link>
                      <Badge variant={badgeInfo.variant}>{badgeInfo.label}</Badge>
                      {product.category && (
                        <Badge variant="outline">{product.category}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {product.description || "ยังไม่มีรายละเอียด"}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {product.price != null && (
                        <span>฿{product.price.toLocaleString()}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        ข้อมูลการตลาด: {product.marketingDataScore}%
                      </span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/products/${product.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          ดูรายละเอียด
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/products/${product.id}?tab=ai`}>
                          <Sparkles className="mr-2 h-4 w-4" />
                          AI วิเคราะห์การตลาด
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {product.status !== "ACTIVE" && (
                        <DropdownMenuItem onClick={() => handleStatusChange(product.id, "ACTIVE")}>
                          เปิดใช้งาน
                        </DropdownMenuItem>
                      )}
                      {product.status === "ACTIVE" && (
                        <DropdownMenuItem onClick={() => handleStatusChange(product.id, "ARCHIVED")}>
                          เก็บถาวร
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        ลบ
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            )
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ก่อนหน้า
              </Button>
              <span className="flex items-center px-3 text-sm text-muted-foreground">
                หน้า {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                ถัดไป
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
