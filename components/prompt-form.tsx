import * as React from 'react'
import Textarea from 'react-textarea-autosize'
import { UseChatHelpers } from 'ai/react'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { IconArrowElbow, IconPlus, IconPlane } from '@/components/ui/icons'
import { useRouter } from 'next/navigation'

export interface PromptProps
  extends Pick<UseChatHelpers, 'input' | 'setInput'> {
  onSubmit: (value: string) => void
  isLoading: boolean
}

export function PromptForm({
  onSubmit,
  input,
  setInput,
  isLoading
}: PromptProps) {
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  return (
    <form
      onSubmit={async e => {
        e.preventDefault()
        if (!input?.trim()) {
          return
        }
        setInput('')
        await onSubmit(input)
      }}
      ref={formRef}
    >
      <div className="relative flex flex-col w-full px-8 overflow-hidden max-h-48 bg-[#141414] ring-[6px] ring-[#141414] rounded-full border-[2px] border-[#242424] text-type-600">
        <div className="flex">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={e => {
                  e.preventDefault()
                  router.refresh()
                  router.push('/')
                }}
                className={cn(
                  buttonVariants({ size: 'sm', variant: 'outline' }),
                  'absolute left-3 top-[10px] size-8 rounded-full bg-transparent hover:bg-theme-700 p-0 sm:left-4 border-[2px] border-[#242424] '
                )}
              >
                <IconPlus className="text-[#242424] font-bold" />
                <span className="sr-only">New Chat</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>New Chat</TooltipContent>
          </Tooltip>
          <Textarea
            ref={inputRef}
            tabIndex={0}
            onKeyDown={onKeyDown}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Send a message."
            spellCheck={false}
            className="w-full resize-none bg-transparent px-4 py-[1rem] focus-within:outline-none sm:text-sm placeholder:text-type-600 placeholder:text-opacity-70 ps-8"
          />
          <div className="absolute right-3 top-[10px] sm:right-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  size="icon"
                  className="bg-transparent hover:bg-transparent right-10"
                  disabled={isLoading || input === ''}
                >
                  <IconPlane className="opacity-75 hover:opacity-100" />
                  <span className="sr-only bg-type-600 text-opacity-70">
                    Send message
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-type-600 bg-type-600">
                Send message
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </form>
  )
}
