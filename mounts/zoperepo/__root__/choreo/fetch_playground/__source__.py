import json

res = context.fetch(
    mode='python',
    choreo_id=choreo_id,
    include_rawdata=True,
)['choreos'][0]

choreo_json = res['rawdata_json']

result = {
    'choreo_json': choreo_json,
    'choreo_name': res['choreo_name'],
    'choreo_author': res['choreo_author'],
    'choreo_id': choreo_id,
}

context.REQUEST.response.setHeader('Content-Type', 'application/json')
return json.dumps(result)
