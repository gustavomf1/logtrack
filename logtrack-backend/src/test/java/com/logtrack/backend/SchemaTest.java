package com.logtrack.backend;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class SchemaTest {

    @Inject
    DataSource dataSource;

    @Test
    void allFiveMigrationsApplied() throws SQLException {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            var rs = s.executeQuery("SELECT count(*) FROM flyway_schema_history WHERE success = true");
            rs.next();
            assertEquals(5, rs.getInt(1));
        }
    }

    @Test
    void connectedRoleIsNotBlockedByRls() throws SQLException {
        UUID id = UUID.randomUUID();
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            s.execute("INSERT INTO zonas (id, nome) VALUES ('" + id + "', 'Zona RLS Test " + id + "')");
            var rs = s.executeQuery("SELECT count(*) FROM zonas WHERE id = '" + id + "'");
            rs.next();
            assertEquals(1, rs.getInt(1), "RLS está bloqueando o papel conectado — precisa ser dono das tabelas ou ter BYPASSRLS");
        }
    }

    @Test
    void movimentacoesTableRejectsUpdate() throws SQLException {
        try (Connection c = dataSource.getConnection(); Statement s = c.createStatement()) {
            s.execute("INSERT INTO zonas (id, nome) VALUES ('" + UUID.randomUUID() + "', 'Zona A " + UUID.randomUUID() + "')");
            SQLException ex = assertThrows(SQLException.class, () ->
                s.execute("UPDATE movimentacoes SET tipo = 'CANCELAMENTO'"));
            assertTrue(ex.getMessage().contains("não podem ser alterados"));
        }
    }
}
