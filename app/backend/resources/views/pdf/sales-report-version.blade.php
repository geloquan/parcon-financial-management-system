<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{ $report->document_title }}</title>
  <style>
    body {
      font-family: DejaVu Sans, Arial, sans-serif;
      color: #2C2422;
      font-size: 12px;
      margin: 0;
    }

    h1 {
      margin: 0 0 8px;
      color: #852030;
      font-size: 20px;
    }

    h2 {
      margin: 18px 0 8px;
      color: #5C1220;
      font-size: 15px;
    }

    h3 {
      margin: 12px 0 6px;
      color: #5C1220;
      font-size: 13px;
    }

    p {
      margin: 0 0 4px;
    }

    .muted {
      color: #7A6A5A;
    }

    .meta-grid {
      margin-bottom: 10px;
      border: 1px solid #E0DBD5;
      padding: 10px;
    }

    .meta-grid p {
      margin-bottom: 2px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }

    th, td {
      border: 1px solid #E0DBD5;
      padding: 6px;
      vertical-align: top;
      text-align: left;
    }

    th {
      background: #F7ECEE;
      color: #5C1220;
    }

    .num {
      text-align: right;
    }

    .profit {
      color: #C49A6C;
      font-weight: 700;
    }

    .loss {
      color: #791F1F;
      font-weight: 700;
    }

    .section {
      margin-top: 12px;
    }

    .chip {
      display: inline-block;
      border-radius: 999px;
      padding: 2px 8px;
      font-size: 10px;
      font-weight: 700;
      border: 1px solid #E0DBD5;
      background: #F7ECEE;
      color: #5C1220;
      margin-right: 6px;
    }

    .chip-gcash { background: #E6F1FB; color: #0C447C; border-color: #B5D4F4; }
    .chip-coffee { background: #FAEEDA; color: #633806; border-color: #FAC775; }
    .chip-print { background: #F7ECEE; color: #5C1220; border-color: #D98A95; }
    .chip-ethereal { background: #EAF3DE; color: #27500A; border-color: #C0DD97; }
    .date-divider { background: #F7ECEE; color: #5C1220; font-weight: 700; }
    .tight p { margin: 0 0 2px; }
    .tiny { font-size: 10px; }
    .graph-list { margin-top: 8px; }
    .graph-row { margin: 6px 0; }
    .graph-label {
      margin-bottom: 2px;
      font-size: 10px;
      color: #7A6A5A;
    }
    .graph-track {
      width: 100%;
      height: 12px;
      background: #F7ECEE;
      border: 1px solid #E0DBD5;
    }
    .graph-fill {
      height: 100%;
      background: #852030;
    }
    .graph-value {
      margin-top: 2px;
      text-align: right;
      font-size: 10px;
      color: #2C2422;
      font-weight: 700;
    }
  </style>
</head>
<body>

<div class="pdf-footer">
  <span class="footer-left">Generated at: {{ now()->format('F j, Y') }}</span>
  <span class="footer-right">Page <span class="page-num"></span></span>
</div>
@php
  $range = $details['range'] ?? [];
  $salesTotals = $details['totals'] ?? [];
  $salesCounts = $details['counts'] ?? [];
  $salesEntries = $details['entries'] ?? [];
  $compensationTotals = $details['compensation_totals'] ?? [];
  $compensationCounts = $details['compensation_counts'] ?? [];
  $compensationEntries = $details['compensation_entries'] ?? [];
  $capitalFlowEntries = $details['capital_flow_entries'] ?? [];
  $capitalFlowTotals = $details['capital_flow_totals'] ?? [];
  $capitalMoneyTotals = $details['capital_money_totals'] ?? [];
  $staffDetails = $details['staff_details'] ?? ['totals' => [], 'entries' => []];
  $scheduleAttendanceDetails = $details['schedule_attendance_details'] ?? ['totals' => [], 'entries' => []];
  $referenceItemsDetails = $details['reference_items_details'] ?? ['totals' => [], 'entries' => []];
  $expensesDetails = $details['expenses_details'] ?? ['totals' => [], 'entries' => []];
  $reportScope = $details['report_scope'] ?? ($metadata['report_scope'] ?? 'business');
  $includeSections = $details['include_sections'] ?? ($metadata['include_sections'] ?? [
    'staff',
    'schedule_attendance',
    'compensation',
    'reference_items',
    'expenses',
    'sales_gcash',
    'sales_coffee',
    'sales_print',
    'sales_ethereal',
    'portfolio_business_money',
  ]);
  $includeSales = in_array($reportType, ['sales', 'combined'], true)
    && (
      in_array('sales_gcash', $includeSections, true)
      || in_array('sales_coffee', $includeSections, true)
      || in_array('sales_print', $includeSections, true)
      || in_array('sales_ethereal', $includeSections, true)
    );
  $includeCompensation = in_array($reportType, ['compensation', 'combined'], true)
    && in_array('compensation', $includeSections, true);
  $includeStaff = in_array('staff', $includeSections, true);
  $includeScheduleAttendance = in_array('schedule_attendance', $includeSections, true);
  $includeReferenceItems = in_array('reference_items', $includeSections, true);
  $includeExpenses = in_array('expenses', $includeSections, true);
  $includeCapitalFlow = in_array('portfolio_business_money', $includeSections, true);
@endphp

<h1>{{ $report->document_title }}</h1>
<div class="meta-grid">
  @if($reportScope === 'all_businesses')
    <p><strong>Businesses:</strong> All Businesses</p>
  @else
    <p><strong>Business:</strong> {{ $metadata['business_name'] ?? '' }}</p>
  @endif
  <p><strong>Scope:</strong> {{ ucfirst(str_replace('_', ' ', $reportScope)) }}</p>
  <p><strong>Report Type:</strong> {{ ucfirst($reportType) }}</p>
  <p><strong>Version:</strong> {{ $report->version }}</p>
  <p><strong>Date Range:</strong>
    {{ isset($range['start_date']) ? \Carbon\Carbon::parse($range['start_date'])->format('F j, Y') : $report->start_date?->format('F j, Y') }}
    –
    {{ isset($range['end_date']) ? \Carbon\Carbon::parse($range['end_date'])->format('F j, Y') : $report->end_date?->format('F j, Y') }}
  </p>
  <p><strong>Generated At:</strong>
    {{ isset($metadata['generated_at']) ? \Carbon\Carbon::parse($metadata['generated_at'])->format('F j, Y, g:i A') : '' }}
  </p>
  <p><strong>Generated By:</strong> {{ $metadata['generated_by'] ?? '' }}
    ({{ $metadata['generated_by_username'] ?? '' }})</p>
</div>

@if($includeSales)
  <div class="section">
    <h2>Sales Summary</h2>
    @php
      $businessSummary = $details['business_summary'] ?? [];
    @endphp
    <table>
      <thead>
      <tr>
        <th>Business</th>
        <th class="num">Entries</th>
        <th class="num">GCash</th>
        <th class="num">Module Sales</th>
        <th class="num">Total</th>
        <th class="num">Profit</th>
      </tr>
      </thead>
      <tbody>
      @forelse($businessSummary as $summary)
        @php
          $slug = (string) ($summary['business_slug'] ?? '');
          $chipClass = match($slug) {
            'gcash' => 'chip-gcash',
            'coffee' => 'chip-coffee',
            'print' => 'chip-print',
            'ethereal' => 'chip-ethereal',
            default => '',
          };
          $icon = match($slug) {
            'gcash' => '💳',
            'coffee' => '☕',
            'print' => '🖨️',
            'ethereal' => '✨',
            default => '🏢',
          };
        @endphp
        <tr>
          <td><span class="chip {{ $chipClass }}">{{ $icon }} {{ $summary['business_name'] ?? 'Business' }}</span></td>
          <td class="num">{{ $summary['entries_count'] ?? 0 }}</td>
          <td class="num">{{ number_format((float) ($summary['gcash_sales'] ?? 0), 2) }}</td>
          <td class="num">{{ number_format((float) ($summary['module_sales'] ?? 0), 2) }}</td>
          <td class="num profit">{{ number_format((float) ($summary['total_sales'] ?? 0), 2) }}</td>
          <td class="num profit">{{ number_format((float) ($summary['total_profit'] ?? 0), 2) }}</td>
        </tr>
      @empty
        <tr>
          <td class="muted">No business data</td>
          <td class="num">0</td>
          <td class="num">0.00</td>
          <td class="num">0.00</td>
          <td class="num">0.00</td>
          <td class="num">0.00</td>
        </tr>
      @endforelse
      <tr>
        <td><strong>Overall Sales</strong></td>
        <td class="num"><strong>{{ $salesCounts['all_entries'] ?? 0 }}</strong></td>
        <td class="num"><strong>{{ number_format((float) ($salesTotals['gcash_sales'] ?? 0), 2) }}</strong></td>
        <td class="num"><strong>{{ number_format((float) (($salesTotals['coffee_sales'] ?? 0) + ($salesTotals['print_sales'] ?? 0) + ($salesTotals['ethereal_sales'] ?? 0)), 2) }}</strong></td>
        <td class="num profit"><strong>{{ number_format((float) ($salesTotals['overall_sales'] ?? 0), 2) }}</strong></td>
        <td class="num profit"><strong>{{ number_format((float) ($salesTotals['overall_profit'] ?? 0), 2) }}</strong></td>
      </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h3>Sales Graph by Business</h3>
    @php
      $maxBusinessSales = collect($businessSummary)
        ->map(fn ($summary) => (float) ($summary['total_sales'] ?? 0))
        ->max();
      $maxBusinessSales = $maxBusinessSales > 0 ? $maxBusinessSales : 1;
    @endphp
    @if(count($businessSummary) === 0)
      <p class="muted">No business sales data available for graph.</p>
    @else
      <div class="graph-list">
        @foreach($businessSummary as $summary)
          @php
            $totalSales = (float) ($summary['total_sales'] ?? 0);
            $barWidth = max(0, min(100, ($totalSales / $maxBusinessSales) * 100));
          @endphp
          <div class="graph-row">
            <div class="graph-label">{{ $summary['business_name'] ?? 'Business' }}</div>
            <div class="graph-track">
              <div class="graph-fill" style="width: {{ number_format($barWidth, 2, '.', '') }}%;"></div>
            </div>
            <div class="graph-value">
              Sales: {{ number_format($totalSales, 2) }} &nbsp;|&nbsp; Profit: {{ number_format((float) ($summary['total_profit'] ?? 0), 2) }}
            </div>
          </div>
        @endforeach
      </div>
    @endif
  </div>

  <div class="section">
    <h3>Sales Graph by Module</h3>
    @php
      $moduleGraph = [
        ['label' => 'GCash',    'value' => (float) ($salesTotals['gcash_sales'] ?? 0),    'profit' => (float) ($salesTotals['gcash_profit'] ?? 0)],
        ['label' => 'Coffee',   'value' => (float) ($salesTotals['coffee_sales'] ?? 0),   'profit' => (float) ($salesTotals['coffee_profit'] ?? 0)],
        ['label' => 'Print',    'value' => (float) ($salesTotals['print_sales'] ?? 0),    'profit' => (float) ($salesTotals['print_profit'] ?? 0)],
        ['label' => 'Ethereal', 'value' => (float) ($salesTotals['ethereal_sales'] ?? 0), 'profit' => (float) ($salesTotals['ethereal_profit'] ?? 0)],
      ];
      $maxModuleSales = collect($moduleGraph)->map(fn ($module) => (float) ($module['value'] ?? 0))->max();
      $maxModuleSales = $maxModuleSales > 0 ? $maxModuleSales : 1;
    @endphp
    <div class="graph-list">
      @foreach($moduleGraph as $module)
        @php
          $moduleValue = (float) ($module['value'] ?? 0);
          $moduleWidth = max(0, min(100, ($moduleValue / $maxModuleSales) * 100));
        @endphp
        <div class="graph-row">
          <div class="graph-label">{{ $module['label'] }}</div>
          <div class="graph-track">
            <div class="graph-fill" style="width: {{ number_format($moduleWidth, 2, '.', '') }}%;"></div>
          </div>
          <div class="graph-value">
            Sales: {{ number_format($moduleValue, 2) }} &nbsp;|&nbsp; Profit: {{ number_format((float) ($module['profit'] ?? 0), 2) }}
          </div>
        </div>
      @endforeach
    </div>
  </div>

  <div class="section">
    <h3>Sales Detail Entries</h3>
    @if(count($salesEntries) === 0)
      <p class="muted">No sales entries in the selected range.</p>
    @else
      <table>
        <thead>
        <tr>
          <th>#</th>
          <th>Module</th>
          <th>Business</th>
          <th>Item &amp; Sale</th>
          <th class="num">Pricing</th>
          <th>Details</th>
        </tr>
        </thead>
        <tbody>
        @php $currentDateLabel = null; @endphp
        @foreach($salesEntries as $index => $entry)
          @php
            $originalPrice = (float) ($entry['reference_item_original_price'] ?? 0);
            $amountCharged = (float) ($entry['amount'] ?? 0);
            $hasVariance = $originalPrice > 0 && $amountCharged !== $originalPrice;
            $dateLabel = isset($entry['sale_date']) && $entry['sale_date']
              ? \Carbon\Carbon::parse($entry['sale_date'])->format('F j, Y')
              : 'No date';
            $module = strtolower((string) ($entry['module'] ?? ''));
            $moduleClass = match($module) {
              'gcash' => 'chip-gcash',
              'coffee' => 'chip-coffee',
              'print' => 'chip-print',
              'ethereal' => 'chip-ethereal',
              default => '',
            };
            $moduleIcon = match($module) {
              'gcash' => '💳',
              'coffee' => '☕',
              'print' => '🖨️',
              'ethereal' => '✨',
              default => '•',
            };
          @endphp
          @if($currentDateLabel !== $dateLabel)
            @php $currentDateLabel = $dateLabel; @endphp
            <tr>
              <td colspan="6" class="date-divider">{{ $currentDateLabel }}</td>
            </tr>
          @endif
          <tr>
            <td>{{ $index + 1 }}</td>
            <td><span class="chip {{ $moduleClass }}">{{ $moduleIcon }} {{ $entry['module'] ?? '' }}</span></td>
            <td>{{ $entry['business_name'] ?? '' }}</td>
            <td class="tight">
              @if(!empty($entry['reference_item_name']))
                <p><strong>{{ $entry['reference_item_name'] }}</strong></p>
              @endif
              @if(!empty($entry['sale_name']))
                <p class="tiny muted">{{ $entry['sale_name'] }}</p>
              @endif
            </td>
            <td class="num">
              <div><span class="muted tiny">Original:</span> {{ $originalPrice > 0 ? number_format($originalPrice, 2) : '' }}</div>
              <div class="{{ $hasVariance ? 'loss' : '' }}"><span class="muted tiny">Charged:</span> {{ number_format($amountCharged, 2) }}</div>
              @if($hasVariance)
                <div class="tiny" style="font-weight:400;">
                  {{ $amountCharged < $originalPrice ? '▼' : '▲' }}
                  {{ number_format(abs($amountCharged - $originalPrice), 2) }}
                </div>
              @endif
            </td>
            <td class="tight">
              @if(isset($entry['sale_date']) && $entry['sale_date'])
                <p class="tiny muted">{{ \Carbon\Carbon::parse($entry['sale_date'])->format('g:i A') }}</p>
              @endif
              @forelse($entry['metadata'] ?? [] as $label => $value)
                @if($value !== null && $value !== '')
                  <div><span
                      class="muted">{{ ucwords(str_replace('_', ' ', (string) $label)) }}:</span> {{ is_numeric($value) ? number_format((float) $value, 2) : $value }}
                  </div>
                @endif
              @empty
              @endforelse
            </td>
          </tr>
        @endforeach
        </tbody>
      </table>
    @endif
  </div>
@endif

@if($includeCompensation)
  <div class="section">
    <h2>Compensation Summary</h2>
    <table>
      <thead>
      <tr>
        <th>Metric</th>
        <th class="num">Value</th>
      </tr>
      </thead>
      <tbody>
      <tr>
        <td>Total Runs</td>
        <td class="num">{{ $compensationCounts['runs_total'] ?? 0 }}</td>
      </tr>
      <tr>
        <td>Pending Runs</td>
        <td class="num">{{ $compensationCounts['runs_pending'] ?? 0 }}</td>
      </tr>
      <tr>
        <td>Finalized Runs</td>
        <td class="num">{{ $compensationCounts['runs_finalized'] ?? 0 }}</td>
      </tr>
      <tr>
        <td>Gross Pay</td>
        <td class="num">{{ number_format((float) ($compensationTotals['gross_pay'] ?? 0), 2) }}</td>
      </tr>
      <tr>
        <td>Total Deductions</td>
        <td class="num loss">{{ number_format((float) ($compensationTotals['total_deductions'] ?? 0), 2) }}</td>
      </tr>
      <tr>
        <td><strong>Net Pay</strong></td>
        <td class="num profit"><strong>{{ number_format((float) ($compensationTotals['net_pay'] ?? 0), 2) }}</strong>
        </td>
      </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h3>Compensation Detail Entries</h3>
    @if(count($compensationEntries) === 0)
      <p class="muted">No compensation runs in the selected range.</p>
    @else
      <table>
        <thead>
        <tr>
          <th>Business</th>
          <th>Run</th>
          <th>Status</th>
          <th>Period</th>
          <th class="num">Net Pay</th>
          <th>Details</th>
        </tr>
        </thead>
        <tbody>
        @foreach($compensationEntries as $entry)
          <tr>
            <td>{{ $entry['business_name'] ?? '' }}</td>
            <td>{{ $entry['entry_name'] ?? '' }}</td>
            <td>{{ $entry['metadata']['payment_status'] ?? '' }}</td>
            <td>
              {{ isset($entry['metadata']['period_start']) ? \Carbon\Carbon::parse($entry['metadata']['period_start'])->format('M j, Y') : '' }}
              @if(isset($entry['metadata']['period_start']) && isset($entry['metadata']['period_end']))–@endif
              {{ isset($entry['metadata']['period_end']) ? \Carbon\Carbon::parse($entry['metadata']['period_end'])->format('M j, Y') : '' }}
            </td>
            <td class="num">{{ number_format((float) ($entry['amount'] ?? 0), 2) }}</td>
            <td>
              @if(!empty($entry['metadata']['computation_mode']))
                <div><span class="muted">Computation Mode:</span> {{ ucwords(str_replace('_', ' ', $entry['metadata']['computation_mode'])) }}</div>
              @endif
              <div><span class="muted">Gross Pay:</span> {{ number_format((float) ($entry['metadata']['gross_pay'] ?? 0), 2) }}</div>
              <div><span class="muted">Total Deductions:</span> {{ number_format((float) ($entry['metadata']['total_deductions'] ?? 0), 2) }}</div>
              <div><span class="muted">No. of Employees:</span> {{ $entry['metadata']['employee_count'] ?? 0 }}</div>
            </td>
          </tr>
        @endforeach
        </tbody>
      </table>
    @endif
  </div>
@endif

@if($includeStaff)
  <div class="section">
    <h2>Staff</h2>
    <table>
      <thead>
      <tr>
        <th class="num">Total</th>
        <th class="num">Profit</th>
        <th class="num">Active</th>
        <th class="num">Inactive</th>
      </tr>
      </thead>
      <tbody>
      <tr>
        <td class="num">{{ $staffDetails['totals']['total_staff'] ?? 0 }}</td>
        <td class="num">{{ $staffDetails['totals']['active_staff'] ?? 0 }}</td>
        <td class="num">{{ $staffDetails['totals']['inactive_staff'] ?? 0 }}</td>
      </tr>
      </tbody>
    </table>

    @if(count($staffDetails['entries'] ?? []) === 0)
      <p class="muted">No staff records for the selected period.</p>
    @else
      <table>
        <thead>
        <tr>
          <th>Business</th>
          <th>Name</th>
          <th>Employment Type</th>
          <th>Status</th>
          <th class="num">Salary</th>
          <th>Employment Dates</th>
        </tr>
        </thead>
        <tbody>
        @foreach(($staffDetails['entries'] ?? []) as $staffEntry)
          <tr>
            <td>{{ $staffEntry['business_name'] ?? '' }}</td>
            <td>{{ $staffEntry['full_name'] ?? '' }}</td>
            <td>{{ $staffEntry['employment_type'] ?? '' }}</td>
            <td>{{ ($staffEntry['is_active'] ?? false) ? 'Active' : 'Inactive' }}</td>
            <td class="num">{{ number_format((float) ($staffEntry['salary'] ?? 0), 2) }}</td>
            <td class="tiny">
              {{ !empty($staffEntry['employment_start_date']) ? \Carbon\Carbon::parse($staffEntry['employment_start_date'])->format('M j, Y') : '' }}
              @if(!empty($staffEntry['employment_start_date']))–@endif
              {{ !empty($staffEntry['employment_end_date']) ? \Carbon\Carbon::parse($staffEntry['employment_end_date'])->format('M j, Y') : 'Present' }}
            </td>
          </tr>
        @endforeach
        </tbody>
      </table>
    @endif
  </div>
@endif

@if($includeScheduleAttendance)
  <div class="section">
    <h2>Schedule &amp; Attendance</h2>
    <table>
      <thead>
      <tr>
        <th class="num">Day Off</th>
        <th class="num">Absence</th>
        <th class="num">Total Events</th>
      </tr>
      </thead>
      <tbody>
      <tr>
        <td class="num">{{ $scheduleAttendanceDetails['totals']['day_off_count'] ?? 0 }}</td>
        <td class="num">{{ $scheduleAttendanceDetails['totals']['absence_count'] ?? 0 }}</td>
        <td class="num">{{ $scheduleAttendanceDetails['totals']['attendance_related_count'] ?? 0 }}</td>
      </tr>
      </tbody>
    </table>

    @if(count($scheduleAttendanceDetails['entries'] ?? []) === 0)
      <p class="muted">No schedule or attendance records in the selected range.</p>
    @else
      <table>
        <thead>
        <tr>
          <th>Date</th>
          <th>Business</th>
          <th>Staff</th>
          <th>Type</th>
          <th>Notes</th>
        </tr>
        </thead>
        <tbody>
        @foreach(($scheduleAttendanceDetails['entries'] ?? []) as $entry)
          <tr>
            <td class="tiny">{{ !empty($entry['event_date']) ? \Carbon\Carbon::parse($entry['event_date'])->format('M j, Y') : '' }}</td>
            <td>{{ $entry['business_name'] ?? '' }}</td>
            <td>{{ $entry['staff_name'] ?? '' }}</td>
            <td>{{ ucwords(str_replace('_', ' ', $entry['event_type'] ?? '')) }}</td>
            <td>{{ $entry['notes'] ?? '' }}</td>
          </tr>
        @endforeach
        </tbody>
      </table>
    @endif
  </div>
@endif

@if($includeReferenceItems)
  <div class="section">
    <h2>Reference Items</h2>
    <table>
      <thead>
      <tr>
        <th class="num">Total</th>
        <th class="num">Profit</th>
        <th class="num">Product</th>
        <th class="num">Service</th>
      </tr>
      </thead>
      <tbody>
      <tr>
        <td class="num">{{ $referenceItemsDetails['totals']['total_items'] ?? 0 }}</td>
        <td class="num">{{ $referenceItemsDetails['totals']['product_items'] ?? 0 }}</td>
        <td class="num">{{ $referenceItemsDetails['totals']['service_items'] ?? 0 }}</td>
      </tr>
      </tbody>
    </table>

    @if(count($referenceItemsDetails['entries'] ?? []) === 0)
      <p class="muted">No reference items found.</p>
    @else
      <table>
        <thead>
        <tr>
          <th>Business</th>
          <th>Name</th>
          <th>Type</th>
          <th class="num">Price</th>
          <th>Description</th>
        </tr>
        </thead>
        <tbody>
        @foreach(($referenceItemsDetails['entries'] ?? []) as $item)
          <tr>
            <td>{{ $item['business_name'] ?? '' }}</td>
            <td>{{ $item['name'] ?? '' }}</td>
            <td>{{ ucfirst($item['item_type'] ?? '') }}</td>
            <td class="num">{{ number_format((float) ($item['price'] ?? 0), 2) }}</td>
            <td>{{ $item['description'] ?? '' }}</td>
          </tr>
        @endforeach
        </tbody>
      </table>
    @endif
  </div>
@endif

@if($includeExpenses)
  <div class="section">
    <h2>Expenses</h2>
    <table>
      <thead>
      <tr>
        <th class="num">Total Records</th>
        <th class="num">Total Amount</th>
      </tr>
      </thead>
      <tbody>
      <tr>
        <td class="num">{{ $expensesDetails['totals']['total_expenses'] ?? 0 }}</td>
        <td class="num loss">{{ number_format((float) ($expensesDetails['totals']['expense_amount_total'] ?? 0), 2) }}</td>
      </tr>
      </tbody>
    </table>

    @if(count($expensesDetails['entries'] ?? []) === 0)
      <p class="muted">No expenses in the selected range.</p>
    @else
      <table>
        <thead>
        <tr>
          <th>Date</th>
          <th>Business</th>
          <th>Purpose</th>
          <th>Description</th>
          <th>Recurrence</th>
          <th class="num">Amount</th>
        </tr>
        </thead>
        <tbody>
        @foreach(($expensesDetails['entries'] ?? []) as $expense)
          <tr>
            <td class="tiny">{{ !empty($expense['date_issued']) ? \Carbon\Carbon::parse($expense['date_issued'])->format('M j, Y') : '' }}</td>
            <td>{{ $expense['business_name'] ?? '' }}</td>
            <td>{{ ucwords(str_replace('_', ' ', $expense['purpose'] ?? '')) }}</td>
            <td>{{ $expense['description'] ?? '' }}</td>
            <td>{{ $expense['recurrence_reference'] ?? '' }}</td>
            <td class="num loss">{{ number_format((float) ($expense['amount'] ?? 0), 2) }}</td>
          </tr>
        @endforeach
        </tbody>
      </table>
    @endif
  </div>
@endif

@if($includeCapitalFlow)
  <div class="section">
    <h2>Capital &amp; Financial Flows</h2>
    <p class="muted tiny">Portfolio and business money movements in the selected date range, with separate all-time debt totals.</p>

    <h3>Portfolio &amp; Business Money Totals (Not Date-Range Filtered)</h3>
    <p class="muted tiny">These totals are computed from all active capital movement records and are not limited by the selected report date range.</p>
    <table>
      <thead>
      <tr>
        <th>Money Type</th>
        <th class="num">Total Amount</th>
      </tr>
      </thead>
      <tbody>
      <tr>
        <td>Portfolio Money (All-Time)</td>
        <td class="num">{{ number_format((float) ($capitalMoneyTotals['portfolio_money_total'] ?? 0), 2) }}</td>
      </tr>
      <tr>
        <td>Business Money (All-Time)</td>
        <td class="num">{{ number_format((float) ($capitalMoneyTotals['business_money_total'] ?? 0), 2) }}</td>
      </tr>
      <tr>
        <td>Debts Outstanding (All-Time)</td>
        <td class="num" style="color:#633806;">{{ number_format((float) ($capitalMoneyTotals['debts_outstanding'] ?? 0), 2) }}</td>
      </tr>
      <tr>
        <td>Debts Settled (All-Time)</td>
        <td class="num profit">{{ number_format((float) ($capitalMoneyTotals['debts_settled'] ?? 0), 2) }}</td>
      </tr>
      </tbody>
    </table>

    @if(count($capitalMoneyTotals['business_breakdown'] ?? []) > 0)
      <table>
        <thead>
        <tr>
          <th>Business</th>
          <th class="num">Money Total (All-Time)</th>
        </tr>
        </thead>
        <tbody>
        @foreach(($capitalMoneyTotals['business_breakdown'] ?? []) as $businessMoney)
          <tr>
            <td>{{ $businessMoney['business_name'] ?? '' }}</td>
            <td class="num">{{ number_format((float) ($businessMoney['money_total'] ?? 0), 2) }}</td>
          </tr>
        @endforeach
        </tbody>
      </table>
    @endif

    @if(!empty($capitalFlowTotals))
      <table>
        <thead>
        <tr>
          <th>Flow Type</th>
          <th class="num">Amount</th>
        </tr>
        </thead>
        <tbody>
        <tr>
          <td>Portfolio Inflows (Add)</td>
          <td class="num profit">{{ number_format((float) ($capitalFlowTotals['portfolio_inflows'] ?? 0), 2) }}</td>
        </tr>
        <tr>
          <td>Portfolio Outflows (Deduct / Transfer / Debt)</td>
          <td class="num loss">{{ number_format((float) ($capitalFlowTotals['portfolio_outflows'] ?? 0), 2) }}</td>
        </tr>
        <tr>
          <td>Business Inflows (Add)</td>
          <td class="num profit">{{ number_format((float) ($capitalFlowTotals['business_inflows'] ?? 0), 2) }}</td>
        </tr>
        <tr>
          <td>Business Outflows (Deduct)</td>
          <td class="num loss">{{ number_format((float) ($capitalFlowTotals['business_outflows'] ?? 0), 2) }}</td>
        </tr>
        <tr>
          <td>Debts Outstanding</td>
          <td class="num" style="color:#633806;">{{ number_format((float) ($capitalFlowTotals['debts_outstanding'] ?? 0), 2) }}</td>
        </tr>
        <tr>
          <td>Debts Settled</td>
          <td class="num profit">{{ number_format((float) ($capitalFlowTotals['debts_settled'] ?? 0), 2) }}</td>
        </tr>
        <tr>
          <td><strong>Total Movements</strong></td>
          <td class="num"><strong>{{ $capitalFlowTotals['total_movements'] ?? 0 }}</strong></td>
        </tr>
        </tbody>
      </table>
    @endif

    <h3>Capital Flow Detail</h3>
    @if(count($capitalFlowEntries) === 0)
      <p class="muted">No capital movements in the selected range.</p>
    @else
      <table>
        <thead>
        <tr>
          <th>Date</th>
          <th>What / Where</th>
          <th>Who</th>
          <th class="num">Amount</th>
          <th>Notes / Remarks</th>
        </tr>
        </thead>
        <tbody>
        @foreach($capitalFlowEntries as $flow)
          @php
            $isDebt = ($flow['direction'] ?? '') === 'debt';
            $isSettled = $isDebt && ($flow['debt_status'] ?? '') === 'settled';
            $isOutstanding = $isDebt && ($flow['debt_status'] ?? '') === 'outstanding';
            $amountClass = in_array($flow['direction'] ?? '', ['add']) ? 'profit' : (in_array($flow['direction'] ?? '', ['deduct', 'transfer']) ? 'loss' : '');
            if ($isOutstanding) $amountClass = 'loss';
            if ($isSettled) $amountClass = 'profit';
          @endphp
          <tr>
            <td class="tiny">{{ $flow['occurred_on'] ?? '' }}</td>
            <td class="tight">
              @if(!empty($flow['what']))
                <p><strong>{{ $flow['what'] }}</strong></p>
              @endif
              @if(!empty($flow['where']))
                <p class="tiny muted">{{ $flow['where'] }}</p>
              @endif
              @if($isDebt)
                <p class="tiny" style="color:{{ $isSettled ? '#27500A' : '#633806' }};">
                  {{ $isSettled ? '✔ Settled' : '⚠ Outstanding' }}
                  @if($isSettled && !empty($flow['settled_at']))
                    on {{ $flow['settled_at'] }}
                    @if(!empty($flow['settled_by']))
                      by {{ $flow['settled_by'] }}
                    @endif
                  @endif
                </p>
              @endif
            </td>
            <td class="tiny">{{ $flow['who'] ?? '' }}</td>
            <td class="num {{ $amountClass }}">{{ number_format((float) ($flow['amount'] ?? 0), 2) }}</td>
            <td class="tight tiny">
              @if(!empty($flow['notes']))
                <p>{{ $flow['notes'] }}</p>
              @endif
              @if(!empty($flow['remarks']))
                <p style="color:#852030;"><em>Remarks: {{ $flow['remarks'] }}</em></p>
              @endif
            </td>
          </tr>
        @endforeach
        </tbody>
      </table>
    @endif
  </div>
@endif

{{-- Page number footer, rendered by dompdf on every page --}}
<style>
  /* push page content up to leave room for footer */
  @page { margin-bottom: 52px; }

  .pdf-footer {
    position: fixed;
    bottom: -36px;
    left: 0;
    right: 0;
    border-top: 1px solid #E0DBD5;
    padding-top: 5px;
    font-size: 9px;
    color: #7A6A5A;
  }
  .pdf-footer .footer-center { text-align: center; }
  .pdf-footer .footer-left   { position: absolute; left: 0; }
  .pdf-footer .footer-right  { position: absolute; right: 0; }
  .page-num:after  { content: counter(page); }
</style>
</body>
</html>
