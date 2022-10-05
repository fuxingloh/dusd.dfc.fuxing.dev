import { Container } from '@components/commons/Container'
import { GetServerSidePropsContext, GetServerSidePropsResult } from 'next'
import { getWhaleApiClient, useWhaleApiClient } from '@components/contexts/WhaleContext'

interface IndexPageProps {
}

export default function IndexPage (props: IndexPageProps): JSX.Element {

  return (
    <Container className='pt-8 pb-24'>
      <div>

      </div>
    </Container>
  )
}

export async function getServerSideProps (context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<IndexPageProps>> {
  const api = getWhaleApiClient(context)

  return {
    props: {
    }
  }
}