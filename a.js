let convname = '1, 4';
const user = '1';
const members = ['4'];
if (convname) {
  if (convname.includes(user)) {
    // Neu cuoc tro chuyen co ten la creator + 1 nguoi khac
    if (convname.includes(members[0]) && members[0] !== user) {
      convname = convname.replace(user, members[1]);
    } else {
      convname = convname.replace(user, members[0]);
    }
  }

  const convSplitName = convname.split(' và ');
  if (members.length > 2) {
    convname = convSplitName[0] + ` và ${members.length - 2} người khác`;
  } else if (members.length === 2) {
    convname = convSplitName[0];
  } else {
    convname = members[0];
  }
  console.log(convname);
}
