<?xml version="1.0" ?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="text"/>
<xsl:template match="/sql">
--
-- CUBRID SQL Script
--
<!-- tables -->
	<xsl:for-each select="table">
<xsl:text>
</xsl:text>
    <xsl:text>-- Table `</xsl:text>
    <xsl:value-of select="@name" />
    <xsl:text>`</xsl:text>
<xsl:text>
</xsl:text>
<xsl:text>
</xsl:text>

    <xsl:text>-- DROP TABLE `</xsl:text>
		<xsl:value-of select="@name" />
		<xsl:text>`;</xsl:text>
<xsl:text>
</xsl:text>
<xsl:text>
</xsl:text>

    <xsl:text>CREATE TABLE `</xsl:text>
		<xsl:value-of select="@name" />
		<xsl:text>` (</xsl:text>
<xsl:text>
</xsl:text>
		<xsl:for-each select="row">
			<xsl:text>  `</xsl:text>
			<xsl:value-of select="@name" />
			<xsl:text>` </xsl:text>

			<xsl:value-of select="datatype" />
			<xsl:text></xsl:text>
			
			<xsl:if test="@null = 0">
				<xsl:text> NOT NULL</xsl:text>
			</xsl:if> 
			
			<xsl:if test="@autoincrement = 1">
				<xsl:text> AUTO_INCREMENT</xsl:text>
			</xsl:if> 

			<xsl:if test="default">
				<xsl:text> DEFAULT </xsl:text>
				<xsl:value-of select="default" />
				<xsl:text></xsl:text>
			</xsl:if>

			<xsl:if test="not (position()=last())">
				<xsl:text>,</xsl:text>
<xsl:text>
</xsl:text>
			</xsl:if> 
		</xsl:for-each>
		
<!-- keys -->
		<xsl:for-each select="key">
			<xsl:text>,</xsl:text>
<xsl:text>
</xsl:text>
			<xsl:choose>
				<xsl:when test="@type = 'PRIMARY'">  PRIMARY KEY (</xsl:when>
				<xsl:when test="@type = 'UNIQUE'">  UNIQUE KEY (</xsl:when>
				<xsl:otherwise>KEY (</xsl:otherwise>
			</xsl:choose>
			
			<xsl:for-each select="part">
				<xsl:text>`</xsl:text><xsl:value-of select="." /><xsl:text>`</xsl:text>
				<xsl:if test="not (position() = last())">
					<xsl:text>, </xsl:text>
				</xsl:if>
			</xsl:for-each>
			<xsl:text>)</xsl:text>
		</xsl:for-each>
<xsl:text>
</xsl:text>
	  <xsl:text>);</xsl:text>
<xsl:text>
</xsl:text>

</xsl:for-each>

<xsl:text>
</xsl:text>
<xsl:text>
-- Foreign Keys 
</xsl:text>
<xsl:text>
</xsl:text>

<!-- fk -->
	<xsl:for-each select="table">
		<xsl:for-each select="row">
			<xsl:for-each select="relation">
				<xsl:text>ALTER TABLE `</xsl:text>
				<xsl:value-of select="../../@name" />
				<xsl:text>` ADD FOREIGN KEY (`</xsl:text>
				<xsl:value-of select="../@name" />
				<xsl:text>`) REFERENCES `</xsl:text>
				<xsl:value-of select="@table" />
				<xsl:text>` (`</xsl:text>
				<xsl:value-of select="@row" />
				<xsl:text>`);</xsl:text>
<xsl:text>
</xsl:text>        
			</xsl:for-each>
		</xsl:for-each>
	</xsl:for-each>
<xsl:text>
</xsl:text>        

<xsl:text>
</xsl:text>        
<xsl:text>
-- Test Data
</xsl:text>
<xsl:text>
</xsl:text>        

  <xsl:for-each select="table">
    <xsl:text>--  INSERT INTO `</xsl:text><xsl:value-of select="@name" />
    <xsl:text>` (</xsl:text>
        <xsl:for-each select="row">
          <xsl:text>`</xsl:text>
          <xsl:value-of select="@name" />
          <xsl:text>`</xsl:text>
          <xsl:if test="not (position()=last())">
          <xsl:text>,</xsl:text>
          </xsl:if>
        </xsl:for-each>
    <xsl:text>) VALUES
--    (</xsl:text>
      <xsl:for-each select="row">
        <xsl:text>''</xsl:text>
        <xsl:if test="not (position()=last())">
          <xsl:text>,</xsl:text>
        </xsl:if>
      </xsl:for-each>
    <xsl:text>);</xsl:text>
<xsl:text>
</xsl:text>        
  </xsl:for-each>

</xsl:template>
</xsl:stylesheet>

