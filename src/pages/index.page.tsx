import { Container } from '@components/commons/Container'
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next'
import { getWhaleApiClient, useWhaleApiClient } from '@components/contexts/WhaleContext'
import { PropsWithChildren, useEffect, useState } from 'react'
import { PoolSwapData } from '@defichain/whale-api-client/dist/api/poolpairs'
import ReactNumberFormat from 'react-number-format'
import { format } from 'date-fns'
import BigNumber from 'bignumber.js'

interface IndexPageProps {
  poolId: string
  USD: number
}

export default function IndexPage (props: IndexPageProps): JSX.Element {
  const [swaps, setSwaps] = useState<PoolSwapData[]>([])
  const [filteredSwaps, setFilteredSwaps] = useState<PoolSwapData[]>([])
  const [amountDUSD, setAmountDUSD] = useState('0')
  const [amountDFI, setAmountDFI] = useState('0')

  const api = useWhaleApiClient()
  const [next, setNext] = useState<string | undefined>(undefined)
  const afterMediaTime = (Date.now() / 1000 - (24 * 60 * 60))

  useEffect(() => {
    api.poolpairs.listPoolSwapsVerbose(props.poolId, 15, next).then(results => {
      const filtered = results.filter(value => value.block.medianTime > afterMediaTime)
      const allSwaps = [...swaps, ...filtered]
      setSwaps(allSwaps)
      if (filtered.length > 0) {
        setNext(results.nextToken)
      }

      const allFilteredSwaps = allSwaps.filter(s => s.to?.symbol === 'DFI' && s.from?.symbol === 'DUSD')
      setFilteredSwaps(allFilteredSwaps)

      setAmountDUSD(filteredSwaps.reduce((totalFrom, data) => {
        return totalFrom.plus(data.fromAmount)
      }, new BigNumber(0)).toString())

      setAmountDFI(filteredSwaps.reduce((totalTo, data) => {
        return totalTo.plus(data.to?.amount!)
      }, new BigNumber(0)).toString())
    })
  }, [next])

  return (
    <Container className='pt-8 pb-24'>
      <h2 className='text-xl font-semibold'>Last 24 Hour</h2>

      <div className='flex flex-wrap py-6 space-x-4'>
        <InformationBlock title='Total Swaps'>{swaps.length}</InformationBlock>
        <InformationBlock title='Total DUSD to DFI Swaps'>{filteredSwaps.length}</InformationBlock>
        <InformationBlock title='Total Amount DUSD (FROM)'>
          <ReactNumberFormat
            value={amountDUSD}
            thousandSeparator
            decimalScale={0}
            displayType='text'
          />
        </InformationBlock>

        <InformationBlock title='Total Amount DFI (TO)'>
          <ReactNumberFormat
            value={amountDFI}
            thousandSeparator
            decimalScale={0}
            displayType='text'
          />
        </InformationBlock>

        <InformationBlock title='Total Amount USD (TO) [Current Price]'>
          <ReactNumberFormat
            value={new BigNumber(amountDFI).times(props.USD).toString()}
            thousandSeparator
            decimalScale={0}
            displayType='text'
          />
        </InformationBlock>

        <InformationBlock title='Average DUSD to DFI to USDT [Current Price]'>
          <ReactNumberFormat
            value={new BigNumber(amountDFI).times(props.USD).div(amountDUSD).toString()}
            thousandSeparator
            decimalScale={8}
            displayType='text'
          />
        </InformationBlock>
      </div>

      <h2 className='text-xl font-semibold'>Individual DUSD to DFI Swaps</h2>
      <div className='py-6'>
        <SwapTable swaps={filteredSwaps} USD={props.USD}/>
      </div>
    </Container>
  )
}

export async function getServerSideProps (context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<IndexPageProps>> {
  const api = getWhaleApiClient(context)

  const pairs = await api.poolpairs.list(200)
  const pair = pairs.find(value => value.symbol === 'DUSD-DFI')!
  const stats = await api.stats.get()

  return {
    props: {
      poolId: pair.id,
      USD: stats.price.usd
    }
  }
}

function SwapTable (props: { swaps: PoolSwapData[], USD: number }): JSX.Element {
  return (
    <div className='flex flex-col'>
      <div className='-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8'>
        <div className='py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8'>
          <div className='shadow overflow-hidden border-b border-gray-200 sm:rounded-lg'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
              <tr>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  TXID
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'
                >
                  FROM DUSD
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'
                >
                  TO DFI
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'
                >
                  TO USD (via DFI/USDT)
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase'
                >
                  USDT/DUSD [Current Price]
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  BLOCK/DATE
                </th>
              </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
              {props.swaps.map((item) => {
                return <SwapTableRow swap={item} key={item.id} USD={props.USD}/>
              })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function SwapTableRow ({ swap, USD }: { swap: PoolSwapData, USD: number }): JSX.Element {
  return (
    <tr>
      <td className='px-6 py-4 whitespace-nowrap'>
        <div className=''>
          <div className='text-sm text-gray-500 truncate w-24 font-mono'>{swap.txid}</div>
        </div>
      </td>
      <td className='px-6 py-4 whitespace-nowrap'>
        <div className='text-gray-900 font-mono'>
          <ReactNumberFormat
            value={swap.fromAmount}
            thousandSeparator
            decimalScale={8}
            displayType='text'
          />
        </div>
      </td>
      <td className='px-6 py-4 whitespace-nowrap'>
        <div className='text-gray-900 font-mono'>
          <ReactNumberFormat
            value={swap.to?.amount}
            thousandSeparator
            decimalScale={8}
            displayType='text'
          />
        </div>
      </td>
      <td className='px-6 py-4 whitespace-nowrap'>
        <ReactNumberFormat
          value={new BigNumber(swap.to?.amount!).times(USD).toString()}
          thousandSeparator
          decimalScale={8}
          displayType='text'
        />
      </td>
      <td className='px-6 py-4 whitespace-nowrap'>
        <ReactNumberFormat
          value={new BigNumber(swap.to?.amount!).times(USD).div(swap.fromAmount).toString()}
          thousandSeparator
          decimalScale={8}
          displayType='text'
        />
      </td>
      <td className='px-6 py-4 whitespace-nowrap'>
        <div className='text-sm text-gray-500'>{swap.block.height}</div>
        <div className='text-sm text-gray-500'>
          {format(swap.block.medianTime * 1000, 'MMM dd, hh:mm:ss aa')}
        </div>
      </td>
    </tr>
  )
}

function InformationBlock (props: PropsWithChildren<{ title: string }>): JSX.Element {
  return (
    <div className='bg-slate-100 px-4 py-3 rounded'>
      <h3 className='text-sm font-semibold'>{props.title}</h3>
      <div className='text-xl font-semibold mt-2 text-slate-700'>
        {props.children}
      </div>
    </div>
  )
}