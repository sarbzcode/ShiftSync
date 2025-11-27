export type RootStackParamList = {
  Auth: undefined
  App: undefined
}

export type AuthStackParamList = {
  Login: undefined
}

export type AppTabParamList = {
  Home: undefined
  Schedule: undefined
  Pay: undefined
  Profile: undefined
}

export type PayStackParamList = {
  Payroll: undefined
  PayDetail: {
    id?: string
    mode?: 'single' | 'ytd'
    year?: string
    summary?: {
      periodLabel: string
      hours: number
      gross: number
      net: number
      adjustments: { name: string; amount: number; direction: 'add' | 'deduct' }[]
    }
  }
}
