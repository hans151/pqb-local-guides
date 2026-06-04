export async function onRequestPost(context) {
  const { ZAPIER_WEBHOOK_URL } = context.env;

  if (!ZAPIER_WEBHOOK_URL) {
    return new Response(JSON.stringify({ success: false, error: 'Server misconfiguration' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  let body;
  try { body = await context.request.json(); }
  catch { return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } }); }

  const { name = '', email = '', phone = '', area, group, vibe, budget, duration, connection } = body;

  if (!email) {
    return new Response(JSON.stringify({ success: false, error: 'Email required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const nameParts = name.trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const areaLabels = {
    parksville: 'Parksville', qualicum: 'Qualicum Beach',
    nanoose: 'Nanoose Bay', coombs: 'Coombs & Errington', surprise: 'Mixed areas'
  };

  const zapierPayload = {
    first_name: firstName,
    last_name: lastName,
    email: email,
    phone: phone || '',
    source: 'Parksville-Qualicum Beach Local Guides',
    lead_note: [
      'Source: Parksville-Qualicum Beach Local Guides',
      'Area of interest: ' + (areaLabels[area] || area || 'Not specified'),
      'Group type: ' + (group || 'Not specified'),
      'Vibe: ' + (vibe || 'Not specified'),
      'Budget: ' + (budget || 'Not specified'),
      'Duration: ' + (duration || 'Not specified'),
      'Connection to area: ' + (connection || 'Not specified')
    ].join('\n')
  };

  try {
    const zapRes = await fetch(ZAPIER_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(zapierPayload)
    });
    if (zapRes.ok) {
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Webhook error' }), {
        status: 502, headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: 'Network error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
