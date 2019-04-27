module.exports = `
<h1>Summary</h1>
<ol>
  <li>You most need to see <b>{{= it.active[0].first }} {{= it.active[0].last }}</b></li>
  <li>In the past month you've attended <b>{{= it.recentlyCount }} events</b></li>
  <li>In the next month you have <b>{{= it.upcomingCount }} events</b> scheduled</li>
</ol>
<h1>Active Rotation</h1>
<table>
  <style>td { width: 250px; }</style>
  <tr>
    <th width="250" align="left">Name</th>
    <th width="250" align="left">Email</th>
    <th width="80" align="left">Score</th>
    <th width="120" align="left">Target</th>
    <th width="120" align="left">Last Seen</th>
    <th width="250" align="left">Event</th>
  </tr>
  {{ for (let i = 0; i < it.active.length; i++) { }}
    {{ const person = it.active[i]; }}
    <tr>
      <td width="250">{{= person.first}} {{= person.last}}</td>
      <td width="250">{{= person.email}}</td>
      <td width="80">{{= person.score !== -1 ? (person.score * 100).toPrecision(3) + '%' : '-' }}</td>
      <td width="120">{{= person.targetFrequency }}</td>
      <td width="120">{{= person.lastEvent.phrase }}</td>
      <td width="250"><a href="{{= person.lastEvent.htmlLink }}">{{= person.lastEvent.summary }}</a></td>
    </tr>
  {{ } }}

</table>

<h1>Scheduled</h1>
<table>
  <style>td { width: 250px; }</style>
  <tr>
    <th width="250" align="left">Name</th>
    <th width="250" align="left">Email</th>
    <th width="80" align="left">Score</th>
    <th width="120" align="left">Target</th>
    <th width="120" align="left">Scheduled</th>
    <th width="250" align="left">Event</th>
  </tr>
  {{ for (let i = 0; i < it.scheduled.length; i++) { }}
    {{ const person = it.scheduled[i]; }}
    <tr>
      <td width="250">{{= person.first}} {{= person.last}}</td>
      <td width="250">{{= person.email}}</td>
      <td width="80">{{= person.score !== -1 ? (person.score * 100).toPrecision(3) + '%' : '-' }}</td>
      <td width="120">{{= person.targetFrequency }}</td>
      <td width="120">{{= it.moment(person.nextEvent.date).format('MMM D, YYYY') }}</td>
      <td width="250"><a href="{{= person.nextEvent.htmlLink }}">{{= person.nextEvent.summary }}</a></td>
    </tr>
  {{ } }}

</table>

<h1>Inactive</h1>
<table>
  <style>td { width: 250px; }</style>
  <tr>
    <th width="250" align="left">Name</th>
    <th width="120" align="left">Target</th>
    <th width="250" align="left">Email</th>
  </tr>
  {{ for (let i = 0; i < it.inactive.length; i++) { }}
    {{ const person = it.inactive[i]; }}
    <tr>
      <td width="250">{{= person.first}} {{= person.last}}</td>
      <td width="120">{{= person.targetFrequency }}</td>
      <td width="250">{{= person.email}}</td>
    </tr>
  {{ } }}

</table>

<a href="https://docs.google.com/spreadsheets/d/11TtAui1fy4HXbDaqB_mlHVzv_hdJw5jD8w7c7h05oaY">Full Directory</a>
`;
