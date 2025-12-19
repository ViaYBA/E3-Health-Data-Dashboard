#Merging JHU Datasets and Vaccination Dataset [Generated]
#comprehensive_ph_recovery_data.csv <- Master/Merged Dataset

#data.csv <- Vaccination Dataset
#time_series_covid19_confirmed_global.csv <- JHU Dataset
#time_series_covid19_deaths_global.csv <- JHU Dataset
#time_series_covid19_recovered_global.csv <- JHU Dataset

import pandas as pd

def process_jhu(filename, value_name):
    df = pd.read_csv(filename)
    df_ph = df[df['Country/Region'] == 'Philippines']
    id_vars = ['Province/State', 'Country/Region', 'Lat', 'Long']
    df_melted = df_ph.melt(id_vars=id_vars, var_name='date', value_name=value_name)
    df_melted = df_melted[df_melted['date'].str.contains('/')] # Ensure valid dates
    df_melted['date'] = pd.to_datetime(df_melted['date'])
    return df_melted[['date', value_name]]

#1. Load JHU Data
df_conf = process_jhu('time_series_covid19_confirmed_global.csv', 'total_confirmed')
df_deaths = process_jhu('time_series_covid19_deaths_global.csv', 'total_deaths')
df_recov = process_jhu('time_series_covid19_recovered_global.csv', 'total_recovered')

#2. Load Vaccination Data
df_vac = pd.read_csv('data.csv')
df_vac_ph = df_vac[(df_vac['location'] == 'Philippines') & (df_vac['iso_code'] != '#country+code')].copy()
df_vac_ph['date'] = pd.to_datetime(df_vac_ph['date'])
df_vac_ph = df_vac_ph[['date', 'people_fully_vaccinated', 'total_boosters', 'daily_vaccinations']]

#3. Merge All
merged = pd.merge(df_conf, df_deaths, on='date', how='left')
merged = pd.merge(merged, df_recov, on='date', how='left')
merged = pd.merge(merged, df_vac_ph, on='date', how='left')

#4. FIX FOR RECOVERED DATA:
#If JHU reports 0 (common after 2021), estimate as Confirmed minus Deaths.
merged['total_recovered'] = merged['total_recovered'].fillna(0)
merged.loc[merged['total_recovered'] == 0, 'total_recovered'] = merged['total_confirmed'] - merged['total_deaths']

#5. Feature Engineering
merged = merged.sort_values('date')
merged['daily_new_cases'] = merged['total_confirmed'].diff().fillna(0)
merged['daily_new_deaths'] = merged['total_deaths'].diff().fillna(0)

merged.to_csv('comprehensive_ph_recovery_data.csv', index=False)
print("Master Dataset Created with Estimated Recovery Logic!")