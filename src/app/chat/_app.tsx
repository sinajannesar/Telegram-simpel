import App, { AppProps, AppContext } from 'next/app'
import React from 'react'
import { Socket } from 'socket.io-client'
import io from 'socket.io-client'

interface MyAppProps extends AppProps {
  socket: Socket | null
}

interface MyAppState {
  socket: Socket | null
}

class MyApp extends App<MyAppProps> {
  static async getInitialProps({ Component, ctx }: AppContext) {
    let pageProps = {}
    
    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx)
    }
    
    return { pageProps }
  }

  state: MyAppState = {
    socket: null,
  }

  componentDidMount() {
    // Connect to WebSocket server and listen to events
    const socket = io()
    this.setState({ socket })
  }

  // Close socket connection
  componentWillUnmount() {
    if (this.state.socket) {
      this.state.socket.close()
    }
  }

  render() {
    const { Component, pageProps } = this.props
    return <Component {...pageProps} socket={this.state.socket} />
  }
}

export default MyApp