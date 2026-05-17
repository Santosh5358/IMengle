package com.anonconnect.repository;

import com.anonconnect.entity.ActiveConnection;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ActiveConnectionRepository extends MongoRepository<ActiveConnection, String> {
    Optional<ActiveConnection> findByUserId(String userId);
    Optional<ActiveConnection> findBySocketId(String socketId);
    void deleteByUserId(String userId);
    void deleteBySocketId(String socketId);

    long count();

    @Aggregation(pipeline = {
            "{$group: { _id: '$userId' }}",
            "{$count: 'count'}"
    })
    long countDistinctByUserId();
}
