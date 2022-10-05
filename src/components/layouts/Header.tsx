import { Container } from '@components/commons/Container'
import Link from 'next/link'
import { HeaderNetworkMenu } from '@components/layouts/HeaderNetworkMenu'
import { FaGithub } from 'react-icons/fa'

export function Header (): JSX.Element {
  return (
    <header className='bg-white'>
      <div className='border-b border-gray-100'>
        <Container className='py-3'>
          <div className='flex items-center justify-between'>
            <Link href={{ pathname: '/' }} passHref>
              <a className='flex items-center cursor-pointer hover:text-primary-500'>
                <h6 className='text-md font-semibold'>DeFiChain DUSD</h6>
              </a>
            </Link>

            <div className='flex items-center'>
              <HeaderNetworkMenu />
              <a className='ml-4 cursor-pointer'
                 href='https://github.com/fuxingloh/dusd.dfc.fuxing.dev' target='_blank' rel="noreferrer">
                <FaGithub className='w-6 h-6' />
              </a>
            </div>
          </div>
        </Container>
      </div>
    </header>
  )
}
