package com.logtrack.backend.seed;

import com.logtrack.backend.common.LogtrackConfig;
import com.logtrack.backend.entity.Portal;
import com.logtrack.backend.entity.Supervisor;
import com.logtrack.backend.entity.Zona;
import com.logtrack.backend.repository.PortalRepository;
import com.logtrack.backend.repository.SupervisorRepository;
import com.logtrack.backend.repository.ZonaRepository;
import com.logtrack.backend.security.PasswordHasher;
import com.logtrack.backend.security.StationTokens;
import io.quarkus.runtime.StartupEvent;
import io.quarkus.runtime.configuration.ConfigUtils;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.util.UUID;

@ApplicationScoped
public class DevDataSeeder {

    private static final Logger LOG = Logger.getLogger(DevDataSeeder.class);

    // Tokens de ativação fixos (um por env do firmware em platformio.ini: zona-a/b/c) -
    // só dados de demo local, nunca usados em prod. Fixos (em vez de gerados via
    // StationTokens.newToken()) para que o link /ativar/{token} gravado no firmware
    // continue valido entre reboots do backend, contanto que o Postgres seja persistente
    // (docker compose) - com Dev Services efemero (quarkus:dev) o banco e recriado a cada
    // subida e o seed roda de novo com os MESMOS tokens/UUIDs abaixo.
    private static final String TOKEN_ZONA_A = "cc613c7959d0f0a0eaf5196f307ae667b1fc4f5361c21614722f40784d1eab03";
    private static final String TOKEN_ZONA_B = "353487c974054727584950814c2c133e7283b8d3a9653766cdbb64c7cf2d624d";
    private static final String TOKEN_ZONA_C = "dd722dd7ead097675efd114dbb3f0ac47630cd6c5cf2f743882752accdf290b0";

    // UUIDs fixos dos lotes de demo, para que tagsLotes[] no firmware (firmware/src/sketch.ino)
    // possa apontar pra eles sem precisar reler o banco a cada seed - ver
    // com.logtrack.backend.entity.Lote: id é @GeneratedValue/@UuidGenerator, então um valor
    // atribuído antes do persist() via JPA seria sobrescrito; por isso o insert é nativo aqui.
    private static final UUID LOTE_001_ID = UUID.fromString("9c672cd2-dc86-4f94-8c5b-7662675c18f8");
    private static final UUID LOTE_002_ID = UUID.fromString("d897e388-6d2f-41c6-8f5e-0844f27cd161");
    private static final UUID LOTE_003_ID = UUID.fromString("eb75d176-55b8-4585-9cdc-413cf85cd308");
    private static final UUID LOTE_004_ID = UUID.fromString("33910e43-3ecf-4796-9291-d26de847a3ec");
    private static final UUID LOTE_005_ID = UUID.fromString("55b7c5f1-2f05-4d9d-a67e-7e5b85b3d72a");

    @Inject
    SupervisorRepository supervisorRepository;

    @Inject
    ZonaRepository zonaRepository;

    @Inject
    PortalRepository portalRepository;

    @Inject
    EntityManager entityManager;

    @Inject
    PasswordHasher passwordHasher;

    @Inject
    StationTokens stationTokens;

    @Inject
    LogtrackConfig config;

    @Transactional
    void onStart(@Observes StartupEvent event) {
        if (!ConfigUtils.isProfileActive("dev")) {
            return;
        }

        if (supervisorRepository.count() > 0) {
            LOG.info("Dados de seed ja existem; pulando.");
            return;
        }

        Supervisor supervisor = new Supervisor();
        supervisor.setEmail("supervisor@logtrack.local");
        supervisor.setSenhaHash(passwordHasher.hash("LogTrack123!"));
        supervisor.setNome("Supervisor");
        supervisorRepository.persist(supervisor);

        Zona recebimento = novaZona("Recebimento");
        Zona almoxarifado = novaZona("Almoxarifado");
        Zona expedicao = novaZona("Expedicao");

        novoPortal("Portal 1 - Recebimento", recebimento, TOKEN_ZONA_A);
        novoPortal("Portal 2 - Almoxarifado", almoxarifado, TOKEN_ZONA_B);
        novoPortal("Portal 3 - Expedicao", expedicao, TOKEN_ZONA_C);

        novoLote(LOTE_001_ID, "LOTE-001", 10);
        novoLote(LOTE_002_ID, "LOTE-002", 20);
        novoLote(LOTE_003_ID, "LOTE-003", 30);
        novoLote(LOTE_004_ID, "LOTE-004", 40);
        novoLote(LOTE_005_ID, "LOTE-005", 50);

        LOG.info("Dados de demonstracao criados: 1 supervisor, 3 zonas, 3 portais, 5 lotes.");
        LOG.info("Login: supervisor@logtrack.local / LogTrack123!");
        LOG.infof("Ativacao zona-a (Recebimento): %s/ativar/%s", config.backendOrigin(), TOKEN_ZONA_A);
        LOG.infof("Ativacao zona-b (Almoxarifado): %s/ativar/%s", config.backendOrigin(), TOKEN_ZONA_B);
        LOG.infof("Ativacao zona-c (Expedicao): %s/ativar/%s", config.backendOrigin(), TOKEN_ZONA_C);
    }

    private Zona novaZona(String nome) {
        Zona zona = new Zona();
        zona.setNome(nome);
        zonaRepository.persist(zona);
        return zona;
    }

    private void novoPortal(String nome, Zona zona, String token) {
        Portal portal = new Portal();
        portal.setNome(nome);
        portal.setZona(zona);
        portal.setTokenCookie(stationTokens.hashToken(token));
        portalRepository.persist(portal);
    }

    private void novoLote(UUID id, String codigo, int quantidade) {
        entityManager.createNativeQuery("""
                INSERT INTO lotes (id, codigo, descricao, quantidade, tag_gravada, arquivado, criado_em)
                VALUES (?1, ?2, ?3, ?4, false, false, now())
                """)
            .setParameter(1, id)
            .setParameter(2, codigo)
            .setParameter(3, "Lote de demonstracao " + codigo)
            .setParameter(4, quantidade)
            .executeUpdate();
    }
}
