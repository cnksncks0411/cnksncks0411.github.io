/**
 * table-charts.js
 * -----------------------------------------------------------------------
 * 이미지로 박혀 있던 인포그래픽을 각 <table>의 실제 데이터로 그리는 차트로 교체.
 * - 데이터 소스는 오직 HTML <table> 뿐입니다. 표 값을 고치면 차트도 그대로 따라옵니다.
 * - 각 section.grid.gap-3 안에 (1) 차트를 꽂을 .chart-mount div, (2) table 이
 *   같이 들어있으면 자동으로 연결해서 그립니다. 둘 중 하나라도 없는 섹션(법률지원,
 *   금융지원, 근골격계질환 예방사업처럼 표가 없는 섹션)은 건너뜁니다.
 * - table.table-style  → "분야별 지원인원/금액" 같은 항목형 표 (행 = 분야)
 * - table.table-style-stats → "연도별 인원/금액" 표 (열 = 연도, 행 = 인원/금액)
 * -----------------------------------------------------------------------
 */
(function () {
  var COLORS = {
    인원: '#2f6fb2',
    금액: '#e08a2c',
  };

  // 분야별 카테고리 색상 (인원/금액 도넛 두 차트에서 같은 분야는 항상 같은 색)
  var CATEGORY_COLORS = ['#14b8a6', '#7c5cbf', '#ef5b5b', '#b0b0b0', '#f2b134', '#3b82f6', '#f97316'];

  function toNumber(text) {
    var t = (text || '').replace(/,/g, '').trim();
    if (t === '' || t === '-') return null;
    var n = Number(t);
    return Number.isNaN(n) ? null : n;
  }

  function formatNumber(n) {
    return Math.round(n).toLocaleString('ko-KR');
  }

  // "분야별 지원인원 및 지원금액" 표: 행 = 분야, 열 = 인원(명) / 금액(백만원)
  function parseCategoryTable(table) {
    var rows = Array.prototype.slice.call(table.querySelectorAll('tbody tr'));
    var labels = [];
    var people = [];
    var amount = [];

    rows.forEach(function (row) {
      var th = row.querySelector('th');
      var rowLabel = th ? th.textContent.trim() : '';
      if (!rowLabel || rowLabel === '합계') return; // 합계 행은 차트에서 제외

      var cells = row.querySelectorAll('td');
      if (cells.length < 2) return;

      labels.push(rowLabel);
      people.push(toNumber(cells[0].textContent));
      amount.push(toNumber(cells[1].textContent));
    });

    if (!labels.length) return null;

    var colors = labels.map(function (_, i) {
      return CATEGORY_COLORS[i % CATEGORY_COLORS.length];
    });

    return { labels: labels, people: people, amount: amount, colors: colors };
  }

  // "연도별 지원인원 및 지원금액" 표: 열 = 연도(+누계/합계), 행 = 인원 / 금액
  function parseYearlyTable(table) {
    var headThs = Array.prototype.slice.call(table.querySelectorAll('thead th')).slice(1);
    var headers = headThs.map(function (th) {
      return th.textContent.trim();
    });

    // 마지막 "누계"/"합계" 열은 흐름을 보여주는 차트에서는 제외
    var cumIndex = headers.findIndex(function (h) {
      return h.indexOf('누계') !== -1 || h.indexOf('합계') !== -1;
    });
    var labels = cumIndex >= 0 ? headers.slice(0, cumIndex) : headers;

    var rows = Array.prototype.slice.call(table.querySelectorAll('tbody tr'));
    var datasets = [];

    rows.forEach(function (row) {
      var th = row.querySelector('th');
      var rowLabel = th ? th.textContent.trim() : '';
      if (!rowLabel) return;

      var cells = Array.prototype.slice.call(row.querySelectorAll('td'));
      var sliced = cumIndex >= 0 ? cells.slice(0, cumIndex) : cells;
      var values = sliced.map(function (td) {
        return toNumber(td.textContent);
      });

      var isAmount = rowLabel.indexOf('금액') !== -1;
      datasets.push({
        label: rowLabel,
        data: values,
        yAxisID: isAmount ? 'y1' : 'y',
        type: isAmount ? 'line' : 'bar',
        borderColor: isAmount ? COLORS.금액 : COLORS.인원,
        backgroundColor: isAmount ? COLORS.금액 : COLORS.인원,
        tension: isAmount ? 0.3 : undefined,
        pointRadius: isAmount ? 3 : undefined,
        borderRadius: isAmount ? undefined : 4,
      });
    });

    if (!labels.length || !datasets.length) return null;

    return { labels: labels, datasets: datasets };
  }

  // 도넛 중앙에 합계 숫자를 그리는 플러그인
  var centerTextPlugin = {
    id: 'centerText',
    afterDraw: function (chart) {
      var opts = chart.config.options.plugins && chart.config.options.plugins.centerText;
      if (!opts) return;
      var ctx = chart.ctx;
      var cx = (chart.chartArea.left + chart.chartArea.right) / 2;
      var cy = (chart.chartArea.top + chart.chartArea.bottom) / 2;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#8a8a8a';
      ctx.font = '400 12px sans-serif';
      ctx.fillText(opts.label, cx, cy - 12);
      ctx.fillStyle = '#222';
      ctx.font = '700 16px sans-serif';
      ctx.fillText(opts.value, cx, cy + 10);
      ctx.restore();
    },
  };
  if (typeof Chart !== 'undefined') {
    Chart.register(centerTextPlugin);
  }

  function createDonutBox() {
    var container = document.createElement('div');
    container.style.flex = '1 1 260px';
    container.style.minWidth = '240px';
    container.style.height = '300px';
    container.style.position = 'relative';
    var canvas = document.createElement('canvas');
    container.appendChild(canvas);
    return { container: container, canvas: canvas };
  }

  function renderDonut(canvas, labels, values, colors, unit, totalLabel) {
    var filteredLabels = [];
    var filteredValues = [];
    var filteredColors = [];
    labels.forEach(function (label, i) {
      if (values[i] === null || values[i] === undefined) return;
      filteredLabels.push(label);
      filteredValues.push(values[i]);
      filteredColors.push(colors[i]);
    });
    if (!filteredValues.length) return null;

    var total = filteredValues.reduce(function (a, b) {
      return a + b;
    }, 0);

    return new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: filteredLabels,
        datasets: [
          {
            data: filteredValues,
            backgroundColor: filteredColors,
            borderColor: '#fff',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { boxWidth: 10, font: { size: 11 } },
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return ctx.label + ': ' + formatNumber(ctx.parsed) + unit;
              },
            },
          },
          centerText: {
            label: totalLabel,
            value: formatNumber(total) + unit,
          },
        },
      },
    });
  }

  function renderCategoryDonuts(mount, table) {
    var data = parseCategoryTable(table);
    if (!data) return;

    var wrap = document.createElement('div');
    wrap.style.display = 'flex';
    wrap.style.flexWrap = 'wrap';
    wrap.style.gap = '16px';
    mount.appendChild(wrap);

    var peopleBox = createDonutBox();
    var amountBox = createDonutBox();
    wrap.appendChild(peopleBox.container);
    wrap.appendChild(amountBox.container);

    renderDonut(peopleBox.canvas, data.labels, data.people, data.colors, '명', '지원인원');
    renderDonut(amountBox.canvas, data.labels, data.amount, data.colors, '백만원', '지원금액');
  }

  function renderChart(canvas, chartData) {
    var hasAmountAxis = chartData.datasets.some(function (d) {
      return d.yAxisID === 'y1';
    });

    return new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                var value = ctx.formattedValue;
                return ctx.dataset.label + ': ' + value;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: '인원(명)' },
          },
          y1: hasAmountAxis
            ? {
                beginAtZero: true,
                position: 'right',
                grid: { drawOnChartArea: false },
                title: { display: true, text: '금액(백만원)' },
              }
            : undefined,
        },
      },
    });
  }

  function initTableCharts() {
    var sections = document.querySelectorAll('section.grid.gap-3');

    sections.forEach(function (section) {
      var mount = section.querySelector('.chart-mount');
      var table = section.querySelector('table');
      if (!mount || !table) return;

      if (table.classList.contains('table-style')) {
        mount.style.height = 'auto';
        renderCategoryDonuts(mount, table);
        return;
      }

      var chartData = parseYearlyTable(table);
      if (!chartData) return;

      var canvas = document.createElement('canvas');
      mount.appendChild(canvas);
      renderChart(canvas, chartData);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTableCharts);
  } else {
    initTableCharts();
  }
})();
