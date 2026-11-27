import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBadge from '../components/StatusBadge'
import { ErrorNotice, Loading } from '../components/Loading'
import { downloadText } from '../components/MigrationParts'
import { api, isAbort } from '../api'
import { checksSummary, formatDateTime, formatDuration, sandboxTotals, statusLabel, statusTone } from '../labels'

const FINISHED = ['COMPLETED', 'FAILED']

function toRow(m) {
  const sandbox = sandboxTotals(m)
  const checks = checksSummary(m)
  return {
    id: m.id,
    name: m.name,
    finishedAt: m.updatedAt,
    tables: m.proposal?.tables?.length ?? 0,
    conflicts: m.proposal?.conflicts?.length ?? 0,
    sandboxRows: sandbox.rows,
    anonymizedColumns: sandbox.anonymizedColumns,
    checks: checks.total ? `${checks.passed}/${checks.total}` : '—',
    durationMs: new Date(m.updatedAt) - new Date(m.createdAt),
    status: m.status,
    error: m.error ?? '',
  }
}

const CSV_COLUMNS = [
  ['id', 'ID'],
  ['name', 'Migração'],
  ['finishedAt', 'Finalizada em'],
  ['tables', 'Tabelas'],
  ['conflicts', 'Conflitos'],
  ['sandboxRows', 'Linhas no sandbox'],
  ['anonymizedColumns', 'Colunas anonimizadas'],
  ['checks', 'Verificações aprovadas'],
  ['durationMs', 'Duração (ms)'],
  ['status', 'Status'],
  ['error', 'Erro'],
]

const csvCell = (v) => {
  const s = String(v ?? '')
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** CSV com ; (abre direto no Excel em pt-BR) e BOM UTF-8 para os acentos. */
function toCsv(rows) {
  const lines = [CSV_COLUMNS.map(([, h]) => h), ...rows.map((r) => CSV_COLUMNS.map(([k]) => (k === 'status' ? statusLabel(r[k]) : r[k])))]
  return '﻿' + lines.map((l) => l.map(csvCell).join(';')).join('\r\n') + '\r\n'
}

export default function Reports() {
  const navigate = useNavigate()
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    api
      .listMigrations({ signal: controller.signal })
      .then((list) => setRows(list.filter((m) => FINISHED.includes(m.status)).map(toRow)))
      .catch((e) => !isAbort(e) && setError(e.message))
    return () => controller.abort()
  }, [])

  const exportCsv = () => downloadText(toCsv(rows), `relatorio-migracoes-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8')

  return (
    <div className="page">
      <div className="page-heading">
        <div><span className="eyebrow">RELATÓRIOS</span><h1>Resultados das migrações</h1><p>Migrações concluídas e falhas, com os números do sandbox e da validação.</p></div>
        <button className="btn btn--secondary" onClick={exportCsv} disabled={!rows?.length}>Exportar CSV</button>
      </div>
      <section className="panel">
        <ErrorNotice error={error && `Backend Core indisponível: ${error}`} />
        {!rows && !error && <Loading>Carregando migrações...</Loading>}
        {rows?.length === 0 && <div className="notice notice--info">Nenhuma migração concluída ou falha ainda.</div>}
        {rows?.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Migração</th><th>Finalizada em</th><th>Tabelas</th><th>Conflitos</th><th>Linhas no sandbox</th><th>Anonimizadas</th><th>Verificações</th><th>Duração</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.name}</strong></td>
                    <td>{formatDateTime(r.finishedAt)}</td>
                    <td>{r.tables}</td>
                    <td>{r.conflicts}</td>
                    <td>{r.sandboxRows}</td>
                    <td>{r.anonymizedColumns}</td>
                    <td>{r.checks}</td>
                    <td>{formatDuration(r.durationMs)}</td>
                    <td><StatusBadge tone={statusTone(r.status)}>{statusLabel(r.status)}</StatusBadge></td>
                    <td><button className="text-button" onClick={() => navigate(`/app/migrations/${r.id}`)}>Visualizar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
