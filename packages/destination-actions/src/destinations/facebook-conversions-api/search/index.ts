import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { CURRENCY_ISO_CODES } from '../constants'
import { currency, value, contents, content_ids, event_time, action_source, content_category } from '../fb-capi-properties'
import { user_data_field, hash_user_data } from '../fb-capi-user-data'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Search',
  description: 'Send a search event to FB',
  fields: {
    user_data: user_data_field,
    event_time: { ...event_time, required: true },
    action_source: { ...action_source, required: true },
    content_category: content_category,
    content_ids: content_ids,
    contents: contents,
    currency: currency,
    value: value,
    search_string: {
      label: 'Search String',
      description: 'Search String',
      type: 'string'
    }
  },
  perform: (request, { payload, settings }) => {
    if (!CURRENCY_ISO_CODES.has(payload.currency)) {
      throw new IntegrationError(
        `${payload.currency} is not a valid currency code.`,
        'Misconfigured required field',
        400
      )
    }

    if (!payload.user_data) {
      throw new IntegrationError('Must include at least one user data property', 'Misconfigured required field', 400)
    }

    if (payload.action_source === 'website' && payload.user_data.client_user_agent === undefined) {
      throw new IntegrationError(
        'If action source is "Website" then client_user_agent must be defined',
        'Misconfigured required field',
        400
      )
    }
    
    return request(`https://graph.facebook.com/v11.0/${settings.pixelId}/events?access_token=${process.env.TOKEN}`, {
      method: 'POST',
      json: {
        data: [
          {
            event_name: 'Search',
            event_time: payload.event_time,
            action_source: payload.action_source,
            user_data: hash_user_data(payload.user_data),
            custom_data: {
              currency: payload.currency,
              content_ids: payload.content_ids,
              contents: payload.contents,
              content_category: payload.content_category,
              value: payload.value,
              search_string: payload.search_string
            }
          }
        ]
      }
    })
  }
}

export default action
