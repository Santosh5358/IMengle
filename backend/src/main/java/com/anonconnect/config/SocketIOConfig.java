package com.anonconnect.config;

import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.Transport;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "socketio.enabled", havingValue = "true", matchIfMissing = true)
public class SocketIOConfig {

    @Value("${socketio.host:0.0.0.0}")
    private String socketIoHost;

    @Value("${socketio.port:9092}")
    private int socketIoPort;

    @Bean
    public SocketIOServer socketIOServer() {
        com.corundumstudio.socketio.Configuration config = new com.corundumstudio.socketio.Configuration();
        config.setHostname(socketIoHost);
        config.setPort(socketIoPort);
        config.setContext("/socket.io");
        config.setTransports(Transport.WEBSOCKET, Transport.POLLING);
        config.setOrigin("*");
        config.setPingTimeout(60000);
        config.setPingInterval(25000);
        config.setMaxFramePayloadLength(1048576);
        return new SocketIOServer(config);
    }
}
