module.exports = `
<table>
  <style>td { width: 250px; }</style>
  <tr>
    <th width="250" align="left">Name</th>
    <th width="80" align="left">Score</th>
    <th width="120" align="left">Last Seen</th>
    <th width="120" align="left">Target</th>
  </tr>
  {{ for (let i = 0; i < it.winners.length; i++) { }}
    {{ const person = it.winners[i]; }}
    <tr>
      <td width="250">{{= person.first}} {{= person.last}}</td>
      <td width="80">{{= parseInt(person.score * 100) }}%</td>
      <td width="120">{{= person.lastSeenPhrase }}</td>
      <td width="120">{{= person.targetFrequency }}</td>
    </tr>
  {{ } }}

</table>

<a href="https://docs.google.com/spreadsheets/d/11TtAui1fy4HXbDaqB_mlHVzv_hdJw5jD8w7c7h05oaY">Full Directory</a>
`;
