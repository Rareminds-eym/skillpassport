import {
    Award,
    Briefcase,
    Calendar,
    Clock,
    MapPin,
    Target,
    TrendingUp
} from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';
import { useLearnerAnalytics } from '@/features/analytics';
import {
  calculateStatusPercentages,
  calculateJobTypeRadarSeries,
  processSkillsForChart,
  getTopLocations,
} from '@/features/analytics/lib';

import { useUser } from '@/shared/model/authStore';

const Analytics = () => {
  const navigate = useNavigate();
  const user = useUser();
  const userEmail = user?.email;

  const {
    applications,
    skillsData,
    loading,
    analytics,
  } = useLearnerAnalytics({ userEmail });

  // Process skills data separately (not dependent on applications)
  const skillsMatch = useMemo(() => processSkillsForChart(skillsData, 5), [skillsData]);

  // Applications Status - Radial Chart
  const statusRadialChartOptions = {
    chart: {
      type: 'radialBar',
      toolbar: { show: false }
    },
    plotOptions: {
      radialBar: {
        offsetY: 0,
        startAngle: 0,
        endAngle: 270,
        hollow: {
          margin: 5,
          size: '30%',
          background: 'transparent',
        },
        dataLabels: {
          name: {
            show: true,
            fontSize: '14px',
            fontWeight: 600,
            offsetY: -10
          },
          value: {
            show: true,
            fontSize: '22px',
            fontWeight: 700,
            offsetY: 5,
            formatter: function (val) {
              return Math.round(val) + '%';
            }
          }
        }
      }
    },
    colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
    labels: ['Accepted', 'Under Review', 'Pending', 'Rejected'],
    legend: {
      show: true,
      floating: true,
      fontSize: '13px',
      position: 'left',
      offsetX: 10,
      offsetY: 10,
      labels: {
        useSeriesColors: true,
      },
      markers: {
        size: 0
      },
      formatter: function(seriesName, opts) {
        return seriesName + ":  " + opts.w.globals.series[opts.seriesIndex];
      },
      itemMargin: {
        vertical: 3
      }
    }
  };

  const statusRadialChartSeries = calculateStatusPercentages(
    analytics.statusCounts,
    analytics.totalApplications
  );

  // Applications Timeline - Column Chart
  const timelineColumnChartOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: true },
      zoom: { enabled: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: '60%',
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      offsetY: -20,
      style: {
        fontSize: '12px',
        colors: ["#304758"]
      }
    },
    colors: ['#6366f1'],
    xaxis: {
      categories: Object.keys(analytics.applicationsByMonth),
      labels: {
        style: {
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      title: {
        text: 'Number of Applications'
      }
    },
    grid: {
      borderColor: '#f1f1f1'
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return val + " applications";
        }
      }
    }
  };

  const timelineColumnChartSeries = [{
    name: 'Applications',
    data: Object.values(analytics.applicationsByMonth)
  }];

  // Job Type Distribution - Multiple Series Radar Chart
  const jobTypeRadarChartOptions = {
    chart: {
      type: 'radar',
      toolbar: { show: false },
      dropShadow: {
        enabled: true,
        blur: 4,
        left: 0,
        top: 0,
        opacity: 0.1
      }
    },
    colors: ['#6366f1', '#10b981', '#f59e0b'],
    stroke: {
      width: 2
    },
    fill: {
      opacity: 0.2
    },
    markers: {
      size: 5,
      hover: {
        size: 7
      }
    },
    xaxis: {
      categories: Object.keys(analytics.jobTypeDistribution),
      labels: {
        style: {
          fontSize: '11px',
          fontWeight: 500
        }
      }
    },
    yaxis: {
      show: true,
      tickAmount: 4,
      labels: {
        formatter: function(val) {
          return Math.round(val);
        }
      }
    },
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '12px',
      markers: {
        width: 12,
        height: 12,
        radius: 2
      },
      itemMargin: {
        horizontal: 10
      }
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val + ' applications';
        }
      }
    }
  };

  const jobTypeRadarChartSeries = calculateJobTypeRadarSeries(
    applications,
    analytics.jobTypeDistribution
  );

  // Location Distribution - Radial Chart
  const topLocations = getTopLocations(analytics.locationDistribution, 5);
  
  const locationRadialChartOptions = {
    chart: {
      type: 'radialBar',
      toolbar: { show: false }
    },
    plotOptions: {
      radialBar: {
        offsetY: 0,
        startAngle: 0,
        endAngle: 360,
        hollow: {
          margin: 5,
          size: '50%',
          background: 'transparent',
        },
        track: {
          show: true,
          background: '#f2f2f2',
        },
        dataLabels: {
          name: {
            show: true,
            fontSize: '12px',
            fontWeight: 600,
            offsetY: 20
          },
          value: {
            show: true,
            fontSize: '18px',
            fontWeight: 700,
            offsetY: -10,
            formatter: function (val) {
              return Math.round(val);
            }
          },
          total: {
            show: true,
            label: 'Total',
            formatter: function (w) {
              return analytics.totalApplications;
            }
          }
        }
      }
    },
    colors: ['#06b6d4', '#ec4899', '#f97316', '#84cc16', '#a855f7'],
    labels: topLocations.labels,
  };

  const locationRadialChartSeries = topLocations.values;

  // Skills Match - Column Chart (using skillsMatch from state)
  const skillsColumnChartOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      horizontal: true
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        horizontal: true,
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      offsetX: 30,
      style: {
        fontSize: '11px',
        colors: ['#304758']
      },
      formatter: function(val) {
        return Math.round(val);
      }
    },
    colors: ['#10b981'],
    xaxis: {
      categories: Object.keys(skillsMatch).slice(0, 5),
      title: {
        text: 'Number of Jobs'
      },
      labels: {
        formatter: function(val) {
          return Math.round(val);
        }
      },
      tickAmount: 'dataPoints',
      forceNiceScale: false,
      decimalsInFloat: 0
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px'
        }
      }
    },
    grid: {
      borderColor: '#f1f1f1'
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return Math.round(val) + ' jobs';
        }
      }
    }
  };

  const skillsColumnChartSeries = [{
    name: 'Jobs',
    data: Object.values(skillsMatch).slice(0, 5)
  }];

  // Response Rate - Radial Chart
  const responseRateChartOptions = {
    chart: {
      type: 'radialBar',
      toolbar: { show: false }
    },
    plotOptions: {
      radialBar: {
        hollow: {
          size: '70%',
        },
        track: {
          background: '#f2f2f2',
        },
        dataLabels: {
          name: {
            show: true,
            fontSize: '14px',
            fontWeight: 600,
            offsetY: -10
          },
          value: {
            show: true,
            fontSize: '30px',
            fontWeight: 700,
            offsetY: 10,
            formatter: function (val) {
              return Math.round(val) + '%';
            }
          }
        }
      }
    },
    colors: ['#3b82f6'],
    labels: ['Response Rate']
  };

  const responseRateChartSeries = [analytics.responseRate];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 p-6">
      {/* Header */}
      <div className="mb-8 bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl shadow-md">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-1 text-sm">Track and analyze your job application performance</p>
            </div>
          </div>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="group bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Total Applications</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.totalApplications}</p>
            </div>
            <div className="h-12 w-12 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Response Rate</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.responseRate}<span className="text-xl text-gray-600">%</span></p>
            </div>
            <div className="h-12 w-12 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Avg Response Time</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.averageResponseTime} <span className="text-sm text-gray-500 font-normal">days</span></p>
            </div>
            <div className="h-12 w-12 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Offers Received</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.statusCounts['accepted'] || 0}</p>
            </div>
            <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {/* Application Status - Radial Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <Target className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Application Status Distribution</h3>
            </div>
          </div>
          <div className="p-6">
            {analytics.totalApplications > 0 ? (
              <ReactApexChart
                options={statusRadialChartOptions}
                series={statusRadialChartSeries}
                type="radialBar"
                height={350}
              />
            ) : (
              <div className="h-[350px] flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 mb-2">📊</div>
                  <p className="text-gray-500 text-sm">No application data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Response Rate - Radial Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <Target className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Response Rate</h3>
            </div>
          </div>
          <div className="p-6">
            {analytics.totalApplications > 0 ? (
              <ReactApexChart
                options={responseRateChartOptions}
                series={responseRateChartSeries}
                type="radialBar"
                height={350}
              />
            ) : (
              <div className="h-[350px] flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 mb-2">🎯</div>
                  <p className="text-gray-500 text-sm">No response data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Applications Timeline - Column Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <Calendar className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Applications Over Time</h3>
            </div>
          </div>
          <div className="p-6">
            {Object.keys(analytics.applicationsByMonth).length > 0 ? (
              <ReactApexChart
                options={timelineColumnChartOptions}
                series={timelineColumnChartSeries}
                type="bar"
                height={350}
              />
            ) : (
              <div className="h-[350px] flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 mb-2">📅</div>
                  <p className="text-gray-500 text-sm">No timeline data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Job Type Distribution - Radar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <Briefcase className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Job Type Distribution</h3>
            </div>
          </div>
          <div className="p-6">
            {Object.keys(analytics.jobTypeDistribution).length > 0 ? (
              <ReactApexChart
                options={jobTypeRadarChartOptions}
                series={jobTypeRadarChartSeries}
                type="radar"
                height={350}
              />
            ) : (
              <div className="h-[350px] flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 mb-2">💼</div>
                  <p className="text-gray-500 text-sm">No job type data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Location Distribution - Radial Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <MapPin className="w-4 h-4 text-indigo-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Location Distribution</h3>
            </div>
          </div>
          <div className="p-6">
            {Object.keys(analytics.locationDistribution).length > 0 ? (
              <ReactApexChart
                options={locationRadialChartOptions}
                series={locationRadialChartSeries}
                type="radialBar"
                height={350}
              />
            ) : (
              <div className="h-[350px] flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 mb-2">📍</div>
                  <p className="text-gray-500 text-sm">No location data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Skills Match - Column Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <Award className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Top Skills in Demand</h3>
            </div>
          </div>
          <div className="p-6">
            <ReactApexChart
              options={skillsColumnChartOptions}
              series={skillsColumnChartSeries}
              type="bar"
              height={350}
            />
          </div>
        </div>
      </div>


      {/* Empty State */}
      {analytics.totalApplications === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-center py-16">
          <div className="max-w-md mx-auto px-6">
            <div className="mb-6 inline-block p-4 bg-indigo-50 rounded-full">
              <TrendingUp className="w-12 h-12 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Applications Yet</h3>
            <p className="text-gray-600 text-sm mb-6">Start applying to jobs to see your analytics dashboard</p>
            <button 
              onClick={() => navigate('/learner/opportunities')}
              className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
            >
              Browse Opportunities
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
