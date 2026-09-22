package com.logtrack.backend.repository;

import com.logtrack.backend.entity.Movimentacao;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;

import java.util.List;
import java.util.UUID;

// Repositório manual (não PanacheRepositoryBase): só insere e consulta,
// nunca expõe update/delete — mesma garantia do trigger de auditoria no banco.
@ApplicationScoped
public class MovimentacaoRepository {

    @Inject
    EntityManager entityManager;

    public void persist(Movimentacao movimentacao) {
        entityManager.persist(movimentacao);
    }

    public List<Movimentacao> listByLoteOrderByTimestampDesc(UUID loteId, int limit) {
        return entityManager.createQuery(
                "select m from Movimentacao m where m.lote.id = :loteId order by m.timestamp desc", Movimentacao.class)
            .setParameter("loteId", loteId)
            .setMaxResults(limit)
            .getResultList();
    }
}
