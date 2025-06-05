var a = selector.clickable(true).text("Via").find()
if(a.size()>0){
  a.mNodes.click()
}
console.log(a.size())
console.log(a.mNodes)
