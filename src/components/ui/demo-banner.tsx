'use client'

import { AlertTriangle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function DemoBanner() {
  return (
    <Card className="bg-yellow-50 border-yellow-200 mb-4">
      <CardContent className="pt-4">
        <div className="flex items-center space-x-2 text-yellow-800">
          <AlertTriangle className="h-5 w-5" />
          <div>
            <p className="font-semibold">デモモード</p>
            <p className="text-sm">
              これはデモ版です。サンプルデータが表示されており、実際のデータベースには接続されていません。
              アップロードされたファイルは一時的に保存され、セッション終了後に削除される場合があります。
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
