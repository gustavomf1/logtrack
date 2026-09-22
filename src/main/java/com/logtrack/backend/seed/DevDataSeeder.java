package com.logtrack.backend.seed;

import com.logtrack.backend.entity.Lote;
import com.logtrack.backend.entity.Portal;
import com.logtrack.backend.entity.Supervisor;
import com.logtrack.backend.entity.Zona;
import com.logtrack.backend.repository.LoteRepository;
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
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

@ApplicationScoped
public class DevDataSeeder {

    private static final Logger LOG = Logger.getLogger(DevDataSeeder.class);

    @Inject
    SupervisorRepository supervisorRepository;

    @Inject
    ZonaRepository zonaRepository;

    @Inject
    PortalRepository portalRepository;

    @Inject
    LoteRepository loteRepository;

    @Inject
    PasswordHasher passwordHasher;

    @Inject
    StationTokens stationTokens;

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

        novoPortal("Portal 1 - Recebimento", recebimento);
        novoPortal("Portal 2 - Almoxarifado", almoxarifado);
        novoPortal("Portal 3 - Expedicao", expedicao);

        for (int i = 1; i <= 5; i++) {
            Lote lote = new Lote();
            lote.setCodigo("LOTE-" + String.format("%03d", i));
            lote.setDescricao("Lote de demonstracao " + i);
            lote.setQuantidade(10 * i);
            loteRepository.persist(lote);
        }

        LOG.info("Dados de demonstracao criados: 1 supervisor, 3 zonas, 3 portais, 5 lotes.");
        LOG.info("Login: supervisor@logtrack.local / LogTrack123!");
    }

    private Zona novaZona(String nome) {
        Zona zona = new Zona();
        zona.setNome(nome);
        zonaRepository.persist(zona);
        return zona;
    }

    private void novoPortal(String nome, Zona zona) {
        Portal portal = new Portal();
        portal.setNome(nome);
        portal.setZona(zona);
        portal.setTokenCookie(stationTokens.hashToken(stationTokens.newToken()));
        portalRepository.persist(portal);
    }
}
