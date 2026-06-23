/**
 * js/pages/dashboard.js
 */
import { customerStore } from '../store/customerStore.js';
import { formatAmount, toIntegerPaise } from '../lib/format.js';
import { aggregateByPeriod } from '../lib/aggregation.js';

export async function renderDashboard(root) {
  root.innerHTML = `<div class="page-loading"><div class="spinner"></div></div>`;
  
  const [summary, topCustomers, allTxs] = await Promise.all([
    customerStore.getDashboardData().then(txs => {
      let lent = 0, repaid = 0;
      txs.forEach(t => {
        const amt = toIntegerPaise(t.amount_paise);
        if (t.type === 'lent') lent += amt;
        else if (t.type === 'repaid') repaid += amt;
      });
      return { totalLent_paise: lent, totalRepaid_paise: repaid, netOutstanding_paise: lent - repaid };
    }),
    customerStore.getTopOutstandingCustomers(5),
    customerStore.getAllTransactions()
  ]);

  const monthlyAgg = aggregateByPeriod(allTxs, 'month');

  root.innerHTML = `
    <div class="page-header">
      <h2 class="page-title">Overview</h2>
      <span class="page-subtitle">Your business at a glance</span>
    </div>

    <div class="grid-3 mb-24">
      <div class="stat-card repaid">
        <div class="stat-accent"></div>
        <div class="stat-body">
          <div class="stat-icon stat-icon--repaid">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Total Repaid</div>
            <div class="stat-value text-green">${formatAmount(summary.totalRepaid_paise)}</div>
          </div>
        </div>
        <div class="stat-spark">${summary.totalRepaid_paise > 0 ? '<svg viewBox="0 0 60 24" fill="none" stroke="var(--accent-green)" stroke-width="2"><polyline points="0,20 10,16 20,18 30,10 40,12 50,4 60,6"/></svg>' : ''}</div>
      </div>

      <div class="stat-card lent">
        <div class="stat-accent"></div>
        <div class="stat-body">
          <div class="stat-icon stat-icon--lent">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Total Lent</div>
            <div class="stat-value text-gold">${formatAmount(summary.totalLent_paise)}</div>
          </div>
        </div>
        <div class="stat-spark">${summary.totalLent_paise > 0 ? '<svg viewBox="0 0 60 24" fill="none" stroke="var(--accent-amber)" stroke-width="2"><polyline points="0,4 10,8 20,6 30,14 40,12 50,18 60,16"/></svg>' : ''}</div>
      </div>

      <div class="stat-card net ${summary.netOutstanding_paise > 0 ? 'positive' : summary.netOutstanding_paise < 0 ? 'negative' : 'neutral'}">
        <div class="stat-accent"></div>
        <div class="stat-body">
          <div class="stat-icon stat-icon--net">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="stat-content">
            <div class="stat-label">Net Outstanding</div>
            <div class="stat-value ${summary.netOutstanding_paise > 0 ? 'text-gold' : summary.netOutstanding_paise < 0 ? 'text-red' : ''}">${formatAmount(summary.netOutstanding_paise)}</div>
          </div>
        </div>
        <div class="stat-badge">${summary.netOutstanding_paise > 0 ? 'Active' :summary.netOutstanding_paise < 0 ? 'Credit' : 'Settled'}</div>
      </div>
    </div>

    <div class="dashboard-charts-row">
      <div class="card chart-card">
        <div class="chart-header">
          <div>
            <h3 class="card-title" style="margin:0">Monthly Recovery Trend</h3>
            <p class="chart-desc">Lent vs Repaid over time</p>
          </div>
          <div class="chart-toggle">
            <button class="chart-toggle-btn active">6M</button>
            <button class="chart-toggle-btn">1Y</button>
            <button class="chart-toggle-btn">All</button>
          </div>
        </div>
        <div class="chart-wrap">
          <canvas id="recoveryChart"></canvas>
        </div>
      </div>

      <div class="card outstanding-card">
        <div class="outstanding-header">
          <h3 class="card-title" style="margin:0">Top Outstanding</h3>
          <span class="outstanding-count">${topCustomers.length} customers</span>
        </div>
        <div class="flex-col gap-8 mt-16">
          ${topCustomers.length === 0 ? `<div class="outstanding-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            <p class="text-sm text-muted text-center mt-8">All accounts settled</p>
          </div>` : 
            topCustomers.map((c, i) => {
              const maxBal = topCustomers[0].balance_paise;
              const pct = maxBal > 0 ? Math.max(8, (c.balance_paise / maxBal) * 100) : 0;
              const isTop = i === 0;
              return `
              <a href="#/customers/${c.id}" class="outstanding-row ${isTop ? 'outstanding-row--top' : ''}" style="text-decoration:none">
                <div class="outstanding-rank ${i < 3 ? 'outstanding-rank--top' : ''}">${i + 1}</div>
                <div class="outstanding-info">
                  <div class="outstanding-name">${c.name}</div>
                  <div class="outstanding-bar-bg">
                    <div class="outstanding-bar" style="width:${pct}%"></div>
                  </div>
                </div>
                <div class="outstanding-amount ${c.balance_paise > 0 ? 'text-gold' : 'text-red'}">${formatAmount(c.balance_paise)}</div>
              </a>`;
            }).join('')
          }
        </div>
        ${topCustomers.length > 0 ? `
          <a href="#/customers" class="btn btn-ghost w-full mt-16" style="justify-content:center">View All Customers</a>
        ` : ''}
      </div>
    </div>
  `;

  // Render Chart
  const chartWrap = root.querySelector('.chart-wrap');
  if (monthlyAgg.length === 0) {
    if (chartWrap) {
      chartWrap.innerHTML = `
        <div class="chart-empty-state">
          <div class="chart-empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </div>
          <div class="chart-empty-title">No transactions recorded yet</div>
          <div class="chart-empty-desc">Lending and repayment trends will show up here once transactions are added.</div>
        </div>
      `;
    }
  } else {
    let chart = null;

    function makeGradient(canvasEl, color, alpha1, alpha2) {
      const canvasH = canvasEl.clientHeight || 300;
      const ctx = canvasEl.getContext('2d');
      const g = ctx.createLinearGradient(0, 0, 0, canvasH);
      g.addColorStop(0, color.replace('1)', `${alpha1})`).replace('rgb', 'rgba'));
      g.addColorStop(1, color.replace('1)', `${alpha2})`).replace('rgb', 'rgba'));
      return g;
    }

    function renderChartForRange(range) {
      if (chart) {
        chart.destroy();
        chart = null;
      }

      const canvas = document.getElementById('recoveryChart');
      const chartCtx = canvas?.getContext('2d');
      if (!chartCtx) return;

      let chartData = monthlyAgg;
      if (range === '6M') {
        chartData = monthlyAgg.slice(-6);
      } else if (range === '1Y') {
        chartData = monthlyAgg.slice(-12);
      }

      const labels = chartData.map(d => d.periodLabel);
      const repaidData = chartData.map(d => d.totalRepaid_paise / 100);
      const lentData = chartData.map(d => d.totalLent_paise / 100);

      const pointRadius = chartData.length === 1 ? 5 : 0;
      const pointHoverRadius = 7;

      const repaidGrad = makeGradient(canvas, 'rgb(52, 211, 153)', 0.18, 0.0);
      const lentGrad = makeGradient(canvas, 'rgb(251, 191, 36)', 0.12, 0.0);

      chart = new Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Repaid',
              data: repaidData,
              borderColor: '#34D399',
              backgroundColor: repaidGrad,
              fill: true,
              tension: 0.4,
              borderWidth: 2.5,
              pointRadius,
              pointHoverRadius,
              pointHitRadius: 12,
              pointBackgroundColor: '#34D399',
              pointBorderColor: '#0E0E0E',
              pointBorderWidth: 3
            },
            {
              label: 'Lent',
              data: lentData,
              borderColor: '#FBBF24',
              backgroundColor: lentGrad,
              fill: true,
              tension: 0.4,
              borderWidth: 2.5,
              pointRadius,
              pointHoverRadius,
              pointHitRadius: 12,
              pointBackgroundColor: '#FBBF24',
              pointBorderColor: '#0E0E0E',
              pointBorderWidth: 3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 800, easing: 'easeOutQuart' },
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: {
              position: 'top',
              align: 'end',
              labels: {
                color: '#A1A1AA',
                boxWidth: 8,
                boxHeight: 8,
                usePointStyle: true,
                pointStyle: 'circle',
                padding: 20,
                font: { family: 'Inter', size: 12, weight: '500' }
              }
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              backgroundColor: '#1C1C1C',
              titleColor: '#EDEDED',
              bodyColor: '#A1A1AA',
              borderColor: 'rgba(255,255,255,0.1)',
              borderWidth: 1,
              padding: 14,
              cornerRadius: 10,
              titleFont: { family: 'Inter', size: 13, weight: '600' },
              bodyFont: { family: 'Inter', size: 12 },
              displayColors: true,
              boxPadding: 4,
              callbacks: {
                label: (ctx) => ` ${ctx.dataset.label}: ₹${ctx.raw.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
              border: { display: false },
              ticks: {
                color: '#71717A',
                font: { family: 'Inter', size: 11 },
                padding: 8,
                callback: (val) => '₹' + val.toLocaleString('en-IN')
              }
            },
            x: {
              grid: { display: false },
              border: { display: false },
              ticks: {
                color: '#71717A',
                font: { family: 'Inter', size: 11 },
                padding: 8
              }
            }
          }
        }
      });
    }

    const toggleBtns = root.querySelectorAll('.chart-toggle-btn');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toggleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const range = btn.textContent.trim();
        renderChartForRange(range);
      });
    });

    // Default view: 6 Months
    renderChartForRange('6M');
  }
}
