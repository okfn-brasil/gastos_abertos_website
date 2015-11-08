id: api

## Revenue
This is the API for the revenue.

### Attributes

| Name | Type | Description | Example |
| ------- | ------- | ------- | ------- |
| **code** | *string* | Revenue code<br/> **pattern:** <code>^(9.)?([1-9].){4}[0-9]{1,2}.[0-9]{1,2}$</code> | `"1.2.3.4.75.0"` |
| **date** | *date-time* | Date (???) | `"2010-08-02T00:00:00+00:00"` |
| **description** | *string* | Description of the revenue | `"IMPOSTO S/ A PROPRIEDADE PREDIAL"` |
| **id** | *integer* | ID of the revenue | `"2"` |
| **monthly_outcome** | *number* | Revenue in a month | `"2392.21"` |
| **monthly_predicted** | *number* | Revenue predicted for a month | `"97974972.10"` |

### Revenue Revenue List
Lists revenue lines.

```
GET /api/v1/receita/list?years={revenue_year}&page={revenue_page}&per_page_num={revenue_per_page_num}
```


#### Curl Example
```bash
$ curl -n -X GET http://demo.gastosabertos.org/api/v1/receita/list?years=$REVENUE_YEAR&page=$REVENUE_PAGE&per_page_num=$REVENUE_PER_PAGE_NUM

```


#### Response Example
```
HTTP/1.1 200 OK
```
```json
[
  {
    "code": "1.2.3.4.75.0",
    "date": "2010-08-02T00:00:00+00:00",
    "description": "IMPOSTO S/ A PROPRIEDADE PREDIAL",
    "id": "2",
    "monthly_outcome": "2392.21",
    "monthly_predicted": "97974972.10"
  }
]
```


