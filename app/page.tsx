import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen, Users, Shield, Crown } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-73px)] bg-gray-950 text-gray-100">
      {/* ヒーローセクション */}
      <section className="bg-gradient-to-b from-gray-900 to-gray-950 py-20 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            あなたの知識を共有し、
            <br className="hidden md:inline" />
            <span className="text-primary">価値を生み出す</span>ブログプラットフォーム
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            会員制ブログシステムで、あなたの専門知識を共有し、読者とつながりましょう。
            様々なプランで柔軟に情報を公開できます。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="px-8">
                今すぐ始める
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/articles">
              <Button size="lg" variant="outline" className="px-8 border-gray-700 hover:bg-gray-800">
                記事を見る
                <BookOpen className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">主な特徴</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 flex flex-col items-center text-center">
              <div className="bg-primary/20 p-3 rounded-full mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">コンテンツ管理</h3>
              <p className="text-gray-300">
                マークダウン形式で簡単に記事を作成・編集できます。画像やコードブロックも美しく表示されます。
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 flex flex-col items-center text-center">
              <div className="bg-primary/20 p-3 rounded-full mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">アクセス制限</h3>
              <p className="text-gray-300">
                記事ごとにアクセスレベルを設定し、特定のプランの会員だけが閲覧できるプレミアムコンテンツを提供できます。
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 flex flex-col items-center text-center">
              <div className="bg-primary/20 p-3 rounded-full mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">会員管理</h3>
              <p className="text-gray-300">
                会員登録、プロフィール管理、プラン管理など、充実した会員管理機能を提供します。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* プランセクション */}
      <section className="py-20 px-4 bg-gray-950">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-4">プラン</h2>
          <p className="text-center text-gray-300 mb-12 max-w-2xl mx-auto">
            あなたのニーズに合わせた様々なプランをご用意しています。
            より高いプランでは、より多くのプレミアムコンテンツにアクセスできます。
          </p>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 flex flex-col">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">FREE</h3>
                <p className="text-gray-400 text-sm">基本機能のみ</p>
              </div>
              <ul className="space-y-2 mb-6 flex-grow">
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  FREEレベルの記事閲覧
                </li>
              </ul>
              <Link href="/register">
                <Button variant="outline" className="w-full border-gray-600 hover:bg-gray-700">
                  登録する
                </Button>
              </Link>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 flex flex-col">
              <div className="mb-4">
                <h3 className="text-xl font-semibold">BASIC</h3>
                <p className="text-gray-400 text-sm">追加機能が利用可能</p>
              </div>
              <ul className="space-y-2 mb-6 flex-grow">
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  FREEレベルの記事閲覧
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  BASICレベルの記事閲覧
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  記事の作成
                </li>
              </ul>
              <Link href="/plans">
                <Button className="w-full">詳細を見る</Button>
              </Link>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-primary flex flex-col relative">
              <div className="absolute -top-3 right-4 bg-primary text-white text-xs px-2 py-1 rounded-full">人気</div>
              <div className="mb-4">
                <h3 className="text-xl font-semibold">PRO</h3>
                <p className="text-gray-400 text-sm">すべての機能が利用可能</p>
              </div>
              <ul className="space-y-2 mb-6 flex-grow">
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  BASICのすべての機能
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  PROレベルの記事閲覧
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  優先サポート
                </li>
              </ul>
              <Link href="/plans">
                <Button className="w-full">詳細を見る</Button>
              </Link>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg shadow-md border border-gray-700 flex flex-col">
              <div className="mb-4">
                <h3 className="text-xl font-semibold flex items-center">
                  VIP
                  <Crown className="h-4 w-4 ml-1 text-yellow-500" />
                </h3>
                <p className="text-gray-400 text-sm">最上位プラン</p>
              </div>
              <ul className="space-y-2 mb-6 flex-grow">
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  PROのすべての機能
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  VIPレベルの記事閲覧
                </li>
                <li className="flex items-center">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  専用サポート
                </li>
              </ul>
              <Link href="/plans">
                <Button variant="outline" className="w-full border-gray-600 hover:bg-gray-700">
                  詳細を見る
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="py-20 px-4 bg-primary/20">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">今すぐ始めましょう</h2>
          <p className="text-xl mb-8 text-gray-300 max-w-2xl mx-auto">
            あなたの知識や経験を共有し、読者とつながりましょう。
            会員制ブログシステムで、あなたのコンテンツに価値を付けることができます。
          </p>
          <Link href="/register">
            <Button size="lg" className="px-8">
              無料で登録する
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
