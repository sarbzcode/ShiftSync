import { useEffect, useMemo, useState, FormEvent } from 'react'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import api from '../lib/api'

type TimezoneResponse = {
  timezone: string
  updated_at?: string
  updated_by_name?: string | null
}

type TimezoneListResponse = {
  timezones: string[]
}

type CurrencyOption = {
  code: string
  name: string
}

type CurrencyResponse = {
  currency: string
  updated_at?: string
  updated_by_name?: string | null
}

type CurrencyListResponse = {
  currencies: CurrencyOption[]
}

type BudgetResponse = {
  budget: number
  updated_at?: string
  updated_by_name?: string | null
}

const FALLBACK_CURRENCIES: CurrencyOption[] = [
  { code: 'USD', name: 'United States Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound Sterling' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'KES', name: 'Kenyan Shilling' },
  { code: 'NGN', name: 'Nigerian Naira' },
  { code: 'GHS', name: 'Ghanaian Cedi' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'DKK', name: 'Danish Krone' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'AED', name: 'United Arab Emirates Dirham' },
  { code: 'SAR', name: 'Saudi Riyal' },
  { code: 'TRY', name: 'Turkish Lira' },
  { code: 'PKR', name: 'Pakistani Rupee' },
  { code: 'BDT', name: 'Bangladeshi Taka' },
  { code: 'PLN', name: 'Polish Zloty' },
  { code: 'CZK', name: 'Czech Koruna' },
  { code: 'HUF', name: 'Hungarian Forint' },
  { code: 'ILS', name: 'Israeli New Shekel' },
  { code: 'EGP', name: 'Egyptian Pound' },
]

export default function SettingsPage() {
  const [timezones, setTimezones] = useState<string[]>([])
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([])
  const [selectedTimezone, setSelectedTimezone] = useState('UTC')
  const [selectedCurrency, setSelectedCurrency] = useState('USD')
  const [timezoneFilter, setTimezoneFilter] = useState('')
  const [currencyFilter, setCurrencyFilter] = useState('')
  const [timezoneLoading, setTimezoneLoading] = useState(true)
  const [currencyLoading, setCurrencyLoading] = useState(true)
  const [timezoneSaving, setTimezoneSaving] = useState(false)
  const [currencySaving, setCurrencySaving] = useState(false)
  const [timezoneError, setTimezoneError] = useState('')
  const [currencyError, setCurrencyError] = useState('')
  const [timezoneSuccess, setTimezoneSuccess] = useState('')
  const [currencySuccess, setCurrencySuccess] = useState('')
  const [currencyApiAvailable, setCurrencyApiAvailable] = useState(true)
 
  const [budgetValue, setBudgetValue] = useState<number | ''>('')
  const [budgetSaving, setBudgetSaving] = useState(false)
  const [budgetLoading, setBudgetLoading] = useState(true)
  const [budgetError, setBudgetError] = useState('')
  const [budgetSuccess, setBudgetSuccess] = useState('')
  const [budgetApiAvailable, setBudgetApiAvailable] = useState(true)
  const [budgetMetadata, setBudgetMetadata] = useState<{
    updated_at?: string
    updated_by_name?: string | null
  }>({})

  useEffect(() => {
    loadTimezoneSettings()
    loadCurrencySettings()
    loadBudgetSettings()
  }, [])

  const filteredTimezones = useMemo(() => {
    if (!timezoneFilter.trim()) return timezones
    const query = timezoneFilter.toLowerCase()
    return timezones.filter((zone) => zone.toLowerCase().includes(query))
  }, [timezoneFilter, timezones])

  const filteredCurrencies = useMemo(() => {
    if (!currencyFilter.trim()) return currencies
    const query = currencyFilter.toLowerCase()
    return currencies.filter(
      (currency) =>
        currency.code.toLowerCase().includes(query) || currency.name.toLowerCase().includes(query)
    )
  }, [currencyFilter, currencies])

  const loadTimezoneSettings = async () => {
    setTimezoneLoading(true)
    setTimezoneError('')
    setTimezoneSuccess('')
    try {
      const [tzResponse, listResponse] = await Promise.all([
        api.get<TimezoneResponse>('/settings/timezone'),
        api.get<TimezoneListResponse>('/settings/timezones?limit=600'),
      ])
      setSelectedTimezone(tzResponse.data.timezone)
      setTimezones(listResponse.data.timezones)
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setTimezoneError(typeof detail === 'string' ? detail : 'Unable to load timezone settings.')
    } finally {
      setTimezoneLoading(false)
    }
  }

  const loadCurrencySettings = async () => {
    setCurrencyLoading(true)
    setCurrencyError('')
    setCurrencySuccess('')
    setCurrencyApiAvailable(true)
    try {
      const [currencyResponse, listResponse] = await Promise.all([
        api.get<CurrencyResponse>('/settings/currency'),
        api.get<CurrencyListResponse>('/settings/currencies?limit=200'),
      ])
      setSelectedCurrency(currencyResponse.data.currency)
      setCurrencies(listResponse.data.currencies)
    } catch (err: any) {
      const status = err.response?.status
      if (status === 404) {
        setCurrencyApiAvailable(false)
        setCurrencies(FALLBACK_CURRENCIES)
        setSelectedCurrency((current) => current || 'USD')
        setCurrencyError(
          'Currency settings API is not available on the server. Showing a default list; saving is disabled until the backend is updated or restarted.'
        )
      } else {
        const detail = err.response?.data?.detail
        setCurrencyError(typeof detail === 'string' ? detail : 'Unable to load currency settings.')
      }
    } finally {
      setCurrencyLoading(false)
    }
  }

  const handleTimezoneSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setTimezoneSaving(true)
    setTimezoneError('')
    setTimezoneSuccess('')
    try {
      const response = await api.put<TimezoneResponse>('/settings/timezone', {
        timezone: selectedTimezone,
      })
      setTimezoneSuccess(
        'Timezone updated successfully. All future records will use the selected timezone.'
      )
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setTimezoneError(typeof detail === 'string' ? detail : 'Unable to save timezone changes.')
    } finally {
      setTimezoneSaving(false)
    }
  }

  const handleCurrencySubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!currencyApiAvailable) {
      setCurrencyError(
        'Saving currency requires the backend currency endpoint to be available. Please update or restart the server.'
      )
      return
    }
    setCurrencySaving(true)
    setCurrencyError('')
    setCurrencySuccess('')
    try {
      const response = await api.put<CurrencyResponse>('/settings/currency', {
        currency: selectedCurrency,
      })
      setCurrencySuccess(
        'Currency updated successfully. Payroll exports and dashboards will use this currency.'
      )
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setCurrencyError(typeof detail === 'string' ? detail : 'Unable to save currency changes.')
    } finally {
      setCurrencySaving(false)
    }
  }

  const loadBudgetSettings = async () => {
    setBudgetLoading(true)
    setBudgetError('')
    setBudgetSuccess('')
    setBudgetApiAvailable(true)
    try {
      const response = await api.get<BudgetResponse>('/settings/budget')
      setBudgetValue(response.data.budget)
      setBudgetMetadata({
        updated_at: response.data.updated_at,
        updated_by_name: response.data.updated_by_name ?? null,
      })
    } catch (err: any) {
      const status = err.response?.status
      if (status === 404) {
        setBudgetApiAvailable(false)
        setBudgetError('Budget setting endpoint is not available yet. Update backend to enable saving.')
        setBudgetValue('')
      } else {
        const detail = err.response?.data?.detail
        setBudgetError(typeof detail === 'string' ? detail : 'Unable to load budget setting.')
      }
    } finally {
      setBudgetLoading(false)
    }
  }

  const handleBudgetSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!budgetApiAvailable) {
      setBudgetError('Saving budget requires the backend budget endpoint. Please enable it first.')
      return
    }
    if (budgetValue === '' || budgetValue < 0) {
      setBudgetError('Please enter a valid quarterly budget.')
      return
    }
    setBudgetSaving(true)
    setBudgetError('')
    setBudgetSuccess('')
    try {
      const response = await api.put<BudgetResponse>('/settings/budget', { budget: Number(budgetValue) })
      setBudgetMetadata({
        updated_at: response.data.updated_at,
        updated_by_name: response.data.updated_by_name ?? null,
      })
      setBudgetSuccess('Quarterly budget saved. Dashboard labor metrics will now use this budget.')
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setBudgetError(typeof detail === 'string' ? detail : 'Unable to save budget changes.')
    } finally {
      setBudgetSaving(false)
    }
  }


  const budgetLastUpdatedLabel = budgetMetadata.updated_at
    ? new Date(budgetMetadata.updated_at).toLocaleString()
    : 'Not set'

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
        <p className="text-sm text-gray-500">
          Control global parameters that every workstation must follow.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleTimezoneSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5"
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Time Zone</h3>
            <p className="text-sm text-gray-500">
              Choose the official timezone for ShiftSync. Clock-ins, shift logs, and payroll
              calculations will automatically align to this timezone.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="timezone-search">
              Search timezones
            </label>
            <input
              id="timezone-search"
              type="text"
              value={timezoneFilter}
              onChange={(event) => setTimezoneFilter(event.target.value)}
              placeholder="Type to filter... e.g., America/"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              disabled={timezoneLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="timezone-select">
              Official timezone
            </label>
            <div className="relative">
              {timezoneLoading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-[rgba(17,20,24,0.6)]">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                </div>
              )}
              <select
                id="timezone-select"
                value={selectedTimezone}
                onChange={(event) => setSelectedTimezone(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                disabled={timezoneLoading || timezoneSaving}
                size={Math.min(10, Math.max(4, filteredTimezones.length || 4))}
              >
                {filteredTimezones.map((timezone) => (
                  <option key={timezone} value={timezone}>
                    {timezone}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {timezoneError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{timezoneError}</span>
            </div>
          )}

          {timezoneSuccess && (
            <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>{timezoneSuccess}</span>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={loadTimezoneSettings}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              disabled={timezoneLoading || timezoneSaving}
            >
              Reset
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={timezoneLoading || timezoneSaving}
            >
              {timezoneSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Timezone
            </button>
          </div>
        </form>

        <form
          onSubmit={handleCurrencySubmit}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5"
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Currency</h3>
            <p className="text-sm text-gray-500">
              Set the default currency for payroll, payouts, and dashboards so all monetary values
              stay consistent across the team.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="currency-search">
              Search currencies
            </label>
            <input
              id="currency-search"
              type="text"
              value={currencyFilter}
              onChange={(event) => setCurrencyFilter(event.target.value)}
              placeholder="Search by code or name... e.g., USD"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              disabled={currencyLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700" htmlFor="currency-select">
              Default currency
            </label>
            <div className="relative">
              {currencyLoading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-[rgba(17,20,24,0.6)]">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                </div>
              )}
              <select
                id="currency-select"
                value={selectedCurrency}
                onChange={(event) => setSelectedCurrency(event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                disabled={currencyLoading || currencySaving || !currencyApiAvailable}
                size={Math.min(8, Math.max(4, filteredCurrencies.length || 4))}
              >
                {filteredCurrencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currencyError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{currencyError}</span>
            </div>
          )}

          {currencySuccess && (
            <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span>{currencySuccess}</span>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={loadCurrencySettings}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              disabled={currencyLoading || currencySaving}
            >
              Reset
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              disabled={currencyLoading || currencySaving || !currencyApiAvailable}
            >
              {currencySaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Currency
            </button>
          </div>
        </form>

      </div>

      <form
        onSubmit={handleBudgetSubmit}
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5 lg:w-1/2"
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Quarterly Budget</h3>
          <p className="text-sm text-gray-500">
            Set the total budget for the current quarter. Dashboard labor and payroll visuals will use this value to
            compute remaining headroom.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700" htmlFor="budget-input">
            Total budget (quarter)
          </label>
          <div className="relative">
            {budgetLoading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-[rgba(17,20,24,0.6)]">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              </div>
            )}
            <input
              id="budget-input"
              type="number"
              min="0"
              step="1000"
              value={budgetValue}
              onChange={(e) => setBudgetValue(e.target.value === '' ? '' : Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="e.g., 75000"
              disabled={budgetLoading || budgetSaving}
            />
          </div>
          <p className="text-xs text-gray-500">Last updated: {budgetLastUpdatedLabel}</p>
        </div>

        {budgetError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{budgetError}</span>
          </div>
        )}

        {budgetSuccess && (
          <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{budgetSuccess}</span>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={loadBudgetSettings}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            disabled={budgetLoading || budgetSaving}
          >
            Reset
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            disabled={budgetLoading || budgetSaving || !budgetApiAvailable}
          >
            {budgetSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Budget
          </button>
        </div>
      </form>
    </div>
  )
}
