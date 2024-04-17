'use client'
import { JSX, SVGProps } from 'react'
import React, { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Header } from '@/components/header'

import { LLMChain } from 'langchain/chains'
import { ChatOpenAI } from 'langchain/chat_models/openai'
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate
} from 'langchain/prompts'

// import { ChatOpenAI } from "@langchain/openai";
import { AgentExecutor } from 'langchain/agents'
// import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from '@langchain/core/runnables'
import { AgentFinish, AgentAction } from '@langchain/core/agents'
import { BaseMessageChunk } from '@langchain/core/messages'
import { SearchApi } from '@langchain/community/tools/searchapi'

import { TavilySearchResults } from '@langchain/community/tools/tavily_search'
// import { ChatOpenAI } from "@langchain/openai";
// import type { ChatPromptTemplate } from "@langchain/core/prompts";
import { createOpenAIFunctionsAgent } from 'langchain/agents'

import { pull } from 'langchain/hub'
// import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";

const model = new ChatOpenAI({
  openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  //@ts-ignore
  model: 'gpt-3.5-turbo-16k',
  temperature: 0.9
})

interface TokenMetadata {
  name: string
  symbol: string
  token_standard: string
}

interface TokenInfo {
  balance: number
}

interface Asset {
  interface: string
  content: {
    metadata: TokenMetadata
  }
  token_info: TokenInfo
}

export default function Component() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [analysis, setAnalysis] = useState<string>('')
  const [tokenInfo, setTokenInfo] = useState<string>('')

  const wallet = useWallet()

  const user = wallet.publicKey?.toBase58()

  console.log(`THIS IS THE CONNECTED OWNER ADDRESS: ${user}`);
  const url = `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`

  useEffect(() => {
    const getAssetsByOwner = async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'my-id',
          method: 'getAssetsByOwner',
          params: {
            ownerAddress: `${user}`,
            page: 1, // Starts at 1
            limit: 1000,
            displayOptions: {
              showFungible: true
            }
          }
        })
      })
      const { result } = await response.json()

      if (result?.items?.length > 0) {
        let data: Asset[] = await result.items

        data = data.sort((a, b) => {
          if (
            a.interface === 'FungibleToken' &&
            b.interface !== 'FungibleToken'
          ) {
            return -1
          }
          if (
            a.interface !== 'FungibleToken' &&
            b.interface === 'FungibleToken'
          ) {
            return 1
          }
          return 0
        })

        setAssets(data)
        console.log(
          'Assets by Owner on the NAAAAAAAVAVAAVAVABAAARRR IS DATA FETCHED IS THIS : ',
          data
        )

        console.log('ASSESTS IS THIS : ', assets)
      } else {
        console.error('Result or Result.items is undefined', result)
      }
    }

    getAssetsByOwner()
  }, [user])

  useEffect(() => {
    console.log('Assets have been updated: ', assets)
  }, [assets])

  // Group assets by their interface type
  const splTokens = assets.filter(asset => asset.interface === 'FungibleToken')
  const nfts = assets.filter(asset => asset.interface === 'V1_NFT')

  // Function to serialize SPL Tokens and NFTs data into a descriptive text format
  function serializeAssets(splTokens: Asset[], nfts: Asset[]): string {
    let splTokensDescription =
      'SPL Tokens:\n' +
      splTokens
        .map(
          token =>
            `Token Name: ${token.content.metadata.name}, Symbol: ${token.content.metadata.symbol}, Balance: ${token.token_info.balance}`
        )
        .join('\n')
    let nftsDescription =
      'NFTs:\n' +
      nfts
        .map(
          nft =>
            `NFT Name: ${nft.content.metadata.name}, Symbol: ${nft.content.metadata.symbol}`
        )
        .join('\n')

    return `${splTokensDescription}\n\n${nftsDescription}`
  }

  useEffect(() => {
    const assetsDescription = serializeAssets(splTokens, nfts)

    const walletAnalysis = async () => {
      const chatPrompt = ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate(
          `Analyze the following wallet contents and provide an aggregated summary of the token holdings, should be something like total SPL tokens held in wallet FOR EXAMPLE, IF THERE ARE 3 DIFFERENT SPL TOKENS YOU SAY 3 SPL TOKENS, total NFts held in wallet etc... just an aggregated insight dont list all the tokens:\n\n${assetsDescription}\n\n
        `
        ),
        HumanMessagePromptTemplate.fromTemplate(`${assets}`)
      ])

      const chain = new LLMChain({ llm: model, prompt: chatPrompt })

      try {
        // The result is an object with a `text` property.
        const resA = await chain.call({ conversation: assets })
        // console.log( resA.text );
        setAnalysis(resA.text)
        console.log('Wallet ANALYSIS:', resA.text)
        return resA
      } catch (error) {
        console.log('Error:', error)
        return error
      } finally {
        console.log('done analysing')
      }
    }

    walletAnalysis()
  }, [assets])

  useEffect(() => {
    // Function to log a message
    console.log('RAVILY SEARCH HERE ....')

    const getLatestTokenInfo = async () => {
      function serializeAssets(splTokens: Asset[]): string {
        let splTokensDescription =
          'SPL Tokens:\n' +
          splTokens
            .map(
              token =>
                `Token Name: ${token.content.metadata.name}, Symbol: ${token.content.metadata.symbol}`
            )
            .join('\n')

        return `${splTokensDescription}\n`
      }

      const tokensToSearch = serializeAssets(splTokens)

      // Setting up the tools and agents for the search
      const tools = [
        new TavilySearchResults({
          maxResults: 1,
          apiKey: process.env.NEXT_PUBLIC_TAVILY_API_KEY
        })
      ]
      const prompt = await pull<ChatPromptTemplate>(
        'hwchase17/openai-functions-agent'
      )
      const llm = new ChatOpenAI({
        openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        //@ts-ignore
        model: 'gpt-3.5-turbo-16k',
        temperature: 0.9
      })
      const agent = await createOpenAIFunctionsAgent({
        llm,
        tools,
        prompt
      })
      const agentExecutor = new AgentExecutor({
        agent,
        tools
      })

      // Invoking the agent to get results
      const result = await agentExecutor.invoke({
        input: `what is the latest information about these crypto tokens ? ${tokensToSearch}, if this token is not a well known or popular token. Just tell the user that it's not a significant token`
      })

      // Setting the token information based on the result
      setTokenInfo(result.output)
      console.log(`this is the damn result: ${result}`)
    }

    // Timeout to delay the execution
    const timer = setTimeout(() => {
      getLatestTokenInfo()
    }, 30000) // 30 seconds delay

    // Cleanup function to clear the timeout if the component unmounts before the timeout fires or if the dependencies change
    return () => clearTimeout(timer)
  }, [splTokens]) // Dependency array, re-run the effect if `splTokens` changes

  return (
    <aside className="h-[97vh] overflow-y-scroll flex flex-col items-center gap-9 py-4 px-6 bg-[#101010] m-4 rounded-[28px] ring-[3px] ring-[#1a1a1a]">
      <Header />
      <div className="w-full flex flex-col gap-6 mt-2">
        <div className="w-full flex justify-center">
          <svg
            width="49"
            height="59"
            viewBox="0 0 49 59"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g clip-path="url(#clip0_4063_878)">
              <g clip-path="url(#clip1_4063_878)">
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M20.5372 11.8308C20.8838 10.5263 20.9941 9.08125 19.9701 7.01213C20.616 5.76559 20.3955 4.12973 19.1035 2.78393C17.9219 1.53912 14.7395 0.860392 13.1797 0.594604C20.0331 6.44463 19.403 10.706 18.9146 12.1154C18.631 12.1749 18.3474 12.2395 18.0637 12.3094C14.1723 11.2717 12.1712 10.0765 9.66614 7.87047C10.1546 6.61037 9.80792 5.06039 8.50023 3.8389C7.3186 2.7477 4.45129 2.25188 2.79701 2.05037C3.67929 3.71443 7.79125 10.2093 15.1961 13.2291C6.43631 16.6654 0.228806 25.1922 0.228806 35.1562C0.228806 48.152 10.7847 58.7024 23.7827 58.7024C36.7806 58.7024 47.3366 48.152 47.3366 35.1562C47.3366 22.1603 36.7806 11.6093 23.7827 11.6093C22.6798 11.6093 21.6085 11.6849 20.5372 11.8308ZM16.4882 17.8493C9.17785 23.0551 7.93322 33.8856 13.7311 42.0201C19.5132 50.1546 30.1635 52.5325 37.4739 47.3267C44.7842 42.1211 46.0289 31.2906 40.2311 23.1561C34.4489 15.0214 23.7986 12.6436 16.4882 17.8493ZM35.4888 25.3881C37.4739 25.3881 39.0811 27.0011 39.0811 28.9881C39.0811 30.9749 37.4739 32.588 35.4888 32.588C33.5036 32.588 31.8809 30.9749 31.8809 28.9881C31.8809 27.0011 33.5036 25.3881 35.4888 25.3881ZM25.4056 25.3881C27.3907 25.3881 29.0136 27.0011 29.0136 28.9881C29.0136 30.9749 27.3907 32.588 25.4056 32.588C23.4204 32.588 21.8132 30.9749 21.8132 28.9881C21.8132 27.0011 23.4204 25.3881 25.4056 25.3881ZM25.0273 26.6538C24.3026 27.1747 24.2555 28.3618 24.9172 29.3032C25.5947 30.2444 26.729 30.5857 27.4537 30.0648C28.1942 29.5438 28.2416 28.3567 27.5798 27.4154C26.9024 26.4741 25.7678 26.1328 25.0273 26.6538ZM35.1106 26.6538C34.3702 27.1747 34.323 28.3618 35.0005 29.3032C35.6622 30.2444 36.7965 30.5857 37.537 30.0648C38.2617 29.5438 38.3088 28.3567 37.6471 27.4154C36.9697 26.4741 35.8354 26.1328 35.1106 26.6538ZM1.70984 2.78661C1.99344 4.33014 2.70254 7.52747 3.96295 8.70264C5.05005 9.71461 6.31052 10.0508 7.41337 9.8052C4.30962 7.01559 2.41882 4.07554 1.70984 2.78661ZM12.455 1.69053C12.6598 3.34371 13.1953 6.20783 14.2982 7.36583C15.3066 8.42157 16.5197 8.83783 17.6068 8.68327C17.1184 6.93525 15.7636 4.55212 12.455 1.69053Z"
                  fill="#F79139"
                />
              </g>
            </g>
            <defs>
              <clipPath id="clip0_4063_878">
                <rect
                  width="48.0136"
                  height="58.8846"
                  fill="white"
                  transform="translate(0 0.115356)"
                />
              </clipPath>
              <clipPath id="clip1_4063_878">
                <rect
                  width="48.0136"
                  height="58.8846"
                  fill="white"
                  transform="translate(0 0.115356)"
                />
              </clipPath>
            </defs>
          </svg>
        </div>
        <div className="w-full grid gap-8">
          {/* SPL-Tokens section */}
          <div className="flex flex-col gap-2">
            <h1 className="font-normal text-type-600 text-sm text-opacity-90 ps-2">
              Assets Summary
            </h1>
            {analysis && (
              <div className="grid gap-0.1 bg-[#141414] border-[0.5px] border-[#1a1a1a] shadow-[0_2px_4px_0_#0000001a] h-full px-5  py-4 rounded-xl mt-0 flex-col items-start justify-between hover:no-underline">
                <h3 className="text-sm font-normal text-left text-type-600 text-opacity-70">
                  {analysis}
                </h3>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="font-normal text-type-600 text-sm text-opacity-90 ps-2">
              Latest Information On your Assets
            </h1>
            {tokenInfo && (
              <h3 className="grid gap-0.1 bg-[#141414] border-[0.5px] border-[#1a1a1a] shadow-[0_2px_4px_0_#0000001a] h-full px-5 text-sm font-normal py-4 rounded-xl mt-0 text-left flex-col items-start justify-between hover:no-underline text-type-600 text-opacity-70">
                {tokenInfo}
              </h3>
            )}
          </div>
        </div>
      </div>
      {/* <div className="grid gap-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 rounded-md bg-gray-100 p-3 dark:bg-gray-800">
            <p className="text-sm font-mono break-all">
              {wallet.publicKey?.toBase58() || 'N/A'}
            </p>
          </div>
        </div>
      </div> */}
    </aside>
  )
}
