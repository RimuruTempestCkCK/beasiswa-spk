import React, { Component } from 'react';
import { Bar } from 'react-chartjs-2';
import { chartColors, sparklineOptions } from '../../../../config/chartTheme';

class Area extends Component {
  constructor(props) {
    super(props);

    const c = chartColors();

    this.state = {
      data77: {
        labels: [
          '19 Sep 00:00',
          '19 Sep 01:30',
          '19 Sep 02:30',
          '19 Sep 03:30',
          '19 Sep 04:30',
          '19 Sep 05:30',
          '19 Sep 06:30',
        ],
        datasets: [
          {
            label: 'series1',
            data: [31, 40, 28, 51, 42, 109, 100],
            backgroundColor: c.primary,
          },
          {
            label: 'series2',
            data: [11, 32, 45, 32, 34, 52, 41],
            backgroundColor: c.success,
          },
        ],
      },
      options77: sparklineOptions({
        datasets: { bar: { barPercentage: 0.8, categoryPercentage: 0.7 } },
        scales: { y: { display: false, beginAtZero: true } },
      }),
    };
  }

  render() {
    return (
      <div className="bar" style={{ position: 'relative', height: 210 }}>
        <Bar data={this.state.data77} options={this.state.options77} />
      </div>
    );
  }
}

export default Area;
