<?php

namespace App\Http\Requests\Sales;

use App\Http\Requests\Concerns\HasMoneyReauthRules;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;

class StoreCoffeeSaleRequest extends FormRequest
{
  use HasMoneyReauthRules;

  public function authorize(): bool
  {
    return true;
  }


  public function rules(): array
  {
    $now = Carbon::now();

    $saleDateRules = [
      'required',
      'date',
//      'before_or_equal:' . $now->toDateTimeString(),                  // must not exceed now()
//      'before_or_equal:' . $now->copy()->subMinutes(30)->toDateTimeString(), // minimum 30 min before now
    ];

    if (! ($this->user()?->hasAnyRole(['admin', 'owner']) ?? false)) {
      $saleDateRules[] = 'after_or_equal:today';
    }

    return [
      'entries'                      => ['nullable', 'array', 'min:1'],
      'entries.*.price'              => ['required_with:entries', 'numeric', 'min:0'],
      'entries.*.coffee_type'        => ['required_with:entries', 'string', 'max:255'],
      'entries.*.size'               => ['required_with:entries', 'in:8oz,9oz,12oz,16oz,18oz'],
      'entries.*.add_on_price'       => ['required_with:entries', 'numeric', 'min:0'],
      'entries.*.add_on_description' => ['nullable', 'string', 'max:500'],
      'entries.*.sale_date'          => $saleDateRules,
      'price'                        => ['required_without:entries', 'numeric', 'min:0'],
      'coffee_type'                  => ['required_without:entries', 'string', 'max:255'],
      'size'                         => ['required_without:entries', 'in:8oz,9oz,12oz,16oz,18oz'],
      'add_on_price'                 => ['required_without:entries', 'numeric', 'min:0'],
      'add_on_description'           => ['nullable', 'string', 'max:500'],
      'sale_date'                    => ['required_without:entries', ...$saleDateRules],
      ...$this->moneyReauthRules(),
    ];
  }
}
