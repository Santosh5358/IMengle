package com.anonconnect.config;

import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.Transport;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SocketIOConfig {

    @Value("${socketio.host}")
    private String host;

    @Value("${socketio.port}")
    private int port;

    @Bean
    public SocketIOServer socketIOServer() {
        com.corundumstudio.socketio.Configuration config = new com.corundumstudio.socketio.Configuration();
        config.setHostname(host);
        config.setPort(port);
        config.setTransports(Transport.WEBSOCKET, Transport.POLLING);
        config.setOrigin("*");
        config.setPingTimeout(60000);
        config.setPingInterval(25000);
        config.setMaxFramePayloadLength(1048576);
        return new SocketIOServer(config);
    }
}
