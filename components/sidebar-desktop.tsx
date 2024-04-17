import { Sidebar } from '@/components/sidebar'
import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@/auth'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { ChatHistory } from '@/components/chat-history'
import {
  IconPlus,
  IconData,
  IconModel,
  IconPromptHistory,
  IconTools
} from '@/components/ui/icons'

export async function SidebarDesktop() {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  return (
    <Sidebar className="peer absolute inset-y-0 z-30 hidden -translate-x-full bg-[#121212] duration-300 ease-in-out data-[state=open]:translate-x-0 lg:flex lg:w-[220px] h-full min-h-screen px-5 pt-4">
      <Image alt="ocada" src="/OCADA.svg" width={92} height={92} />
      <div className="mt-5 mb-3">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'h-10 w-full justify-start bg-[#171717] px-4 shadow-none transition-colors hover:bg-zinc-200/40 border-none mb-2 rounded-full ring-[3px] ring-[#1a1a1a]'
          )}
        >
          <IconPlus className="-translate-x-2" />
          New Chat
        </Link>
      </div>
      <menu className="h-full flex flex-col">
        <>
          <div className="flex flex-col gap-3 mb-3">
            <Link
              href="/"
              className="text-base text-type-600 text-opacity-50 font-medium flex gap-2 items-center"
            >
              <IconData className="stroke-type-600 opacity-50" />
              Data
            </Link>
            <Link
              href="/"
              className="text-base text-type-600 text-opacity-50 font-medium flex gap-2 items-center"
            >
              <IconTools className="stroke-type-600 opacity-50" />
              Tools
            </Link>
            <Link
              href="/"
              className="text-base text-type-600 text-opacity-50 font-medium flex gap-2 items-center"
            >
              <IconModel className="stroke-type-600 opacity-50" />
              Model
            </Link>
            <p className="text-base text-type-600 text-opacity-50 font-medium flex gap-2 items-center">
              <IconPromptHistory className="stroke-type-600 opacity-50" />
              History
            </p>
          </div>
          <ChatHistory userId={session.user.id} />
        </>
      </menu>
    </Sidebar>
  )
}
